import json
import os

import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import types

from services import mcp_service

load_dotenv()

_SYSTEM_PROMPT = (
    "You are a concise financial research assistant. "
    "Use the available tools to answer questions about stock prices, "
    "analyst consensus, and market performance. "
    "Always cite the data you retrieve. Keep answers focused and brief."
)

# Gemini provider
_API_KEY = os.environ.get("GEMINI_API_KEY", "")
_LLM_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash-lite")
_client = genai.Client(api_key=_API_KEY)

_CONFIG = types.GenerateContentConfig(
    system_instruction=_SYSTEM_PROMPT,
    tools=[
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="quote",
                    description=(
                        "Get the current stock quote for a ticker symbol, "
                        "including price, change, analyst consensus, "
                        "and key trading data."
                    ),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "endpoint": types.Schema(type="STRING", enum=["quote"]),
                            "symbol": types.Schema(
                                type="STRING",
                                description=(
                                    "Stock ticker symbol, e.g. AAPL, NVDA, TSLA"
                                ),
                            ),
                        },
                        required=["endpoint", "symbol"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="marketPerformance",
                    description=(
                        "Get market-wide performance data: biggest gainers, "
                        "biggest losers, or most actively traded stocks today."
                    ),
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "endpoint": types.Schema(
                                type="STRING",
                                enum=[
                                    "biggest-gainers",
                                    "biggest-losers",
                                    "most-actives",
                                ],
                            ),
                        },
                        required=["endpoint"],
                    ),
                ),
            ]
        )
    ],
)

# OpenRouter provider
_OR_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
_OR_MODEL = os.environ.get("OPENROUTER_MODEL", "inclusionai/ring-2.6-1t:free")
_OR_URL = "https://openrouter.ai/api/v1/chat/completions"
_OR_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "quote",
            "description": (
                "Get the current stock quote for a ticker symbol, including price, "
                "change, analyst consensus, and key trading data."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "endpoint": {"type": "string", "enum": ["quote"]},
                    "symbol": {
                        "type": "string",
                        "description": "Stock ticker symbol, e.g. AAPL, NVDA, TSLA",
                    },
                },
                "required": ["endpoint", "symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "marketPerformance",
            "description": (
                "Get market-wide performance data: biggest gainers, "
                "biggest losers, or most actively traded stocks today."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "endpoint": {
                        "type": "string",
                        "enum": ["biggest-gainers", "biggest-losers", "most-actives"],
                    },
                },
                "required": ["endpoint"],
            },
        },
    },
]


async def _chat_gemini(message: str) -> str:
    contents = [types.Content(role="user", parts=[types.Part(text=message)])]

    for _ in range(5):
        response = await _client.aio.models.generate_content(
            model=_LLM_MODEL,
            contents=contents,
            config=_CONFIG,
        )

        model_content = response.candidates[0].content
        contents.append(model_content)

        fn_calls = [p for p in model_content.parts if p.function_call]
        if not fn_calls:
            break

        tool_parts = []
        for part in fn_calls:
            fc = part.function_call
            result = await mcp_service.call_tool(fc.name, dict(fc.args))
            tool_parts.append(
                types.Part(
                    function_response=types.FunctionResponse(
                        name=fc.name,
                        response={"result": result},
                    )
                )
            )
        contents.append(types.Content(role="user", parts=tool_parts))

    for part in reversed(response.candidates[0].content.parts):
        if part.text:
            return part.text
    return ""


async def _chat_openrouter(message: str) -> str:
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": message},
    ]

    async with httpx.AsyncClient(timeout=60) as client:
        for _ in range(5):
            resp = await client.post(
                _OR_URL,
                headers={"Authorization": f"Bearer {_OR_API_KEY}"},
                json={"model": _OR_MODEL, "messages": messages, "tools": _OR_TOOLS},
            )
            resp.raise_for_status()
            choice = resp.json()["choices"][0]
            msg = choice["message"]
            messages.append(msg)

            tool_calls = msg.get("tool_calls") or []
            if not tool_calls:
                break

            for tc in tool_calls:
                fn = tc["function"]
                args = json.loads(fn["arguments"])
                result = await mcp_service.call_tool(fn["name"], args)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": result,
                    }
                )

    return messages[-1].get("content") or ""


async def chat(message: str) -> str:
    try:
        return await _chat_gemini(message)
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower() or "RESOURCE_EXHAUSTED" in err:
            return await _chat_openrouter(message)
        raise
