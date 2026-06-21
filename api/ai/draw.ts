/**
 * Vercel Edge Function for AI-powered drawing commands
 * Proxies requests to Claude API and streams back SSE events
 *
 * POST /api/ai/draw
 * Request: { messages, canvasWidth, canvasHeight, currentColors }
 * Response: SSE stream with token/commands/done/error events
 */

export const config = {
  runtime: "edge",
};

// Tool definition for canvas control
const CANVAS_CONTROL_TOOL = {
  name: "canvas_control",
  description: `Execute drawing commands on the canvas. You have access to all MS Paint tools and operations.

IMPORTANT GUIDELINES:
- Use coordinates within canvas bounds (0 to width-1, 0 to height-1)
- Colors are hex strings like "#FF0000" for red
- For paths, use "x1,y1;x2,y2;x3,y3" format
- Always provide complete commands with required parameters
- You can batch multiple commands in a single call for efficiency`,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      commands: {
        type: "array",
        minItems: 1,
        description: "Array of drawing commands to execute",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            tool: {
              type: "string",
              enum: [
                "pencil",
                "brush",
                "airbrush",
                "eraser",
                "line",
                "rectangle",
                "rounded_rectangle",
                "ellipse",
                "polygon",
                "curve",
                "fill",
                "pick_color",
                "text",
                "magnifier",
                "select_rectangle",
                "select_freeform",
                "select_all",
                "deselect",
                "move_selection",
                "copy",
                "cut",
                "paste",
                "delete_selection",
                "crop_to_selection",
                "flip",
                "rotate",
                "stretch",
                "skew",
                "resize_selection",
                "clear",
                "resize_canvas",
                "set_attributes",
                "get_attributes",
                "invert_colors",
                "new_image",
                "load_image",
                "export_image",
                "set_color",
                "swap_colors",
                "set_palette_color",
                "set_custom_color",
                "get_custom_colors",
                "define_color",
                "sample_color",
                "load_palette",
                "save_palette",
                "undo",
                "redo",
                "repeat",
                "batch_shapes",
                "batch_points",
                "pattern_repeat",
                "draw_grid",
                "draw_path",
              ],
              description: "Tool name",
            },
            params: {
              type: "object",
              description: "Parameters for the command (varies by tool)",
              additionalProperties: true,
            },
          },
          required: ["tool", "params"],
        },
      },
    },
    required: ["commands"],
  },
};

// System prompt for the AI
const SYSTEM_PROMPT = `You are an AI assistant integrated into MCPaint, a web-based clone of MS Paint. You help users draw and manipulate images through natural language commands.

STRICT OUTPUT RULES:
- Always call the canvas_control tool exactly once per request.
- Before the tool call, provide a short user-visible summary (1–2 sentences) of what you will draw/change.
- Do not include JSON or command data in the text summary.
- Commands must be complete, consistent with the user request, and immediately executable.
- Use integer coordinates within bounds. Avoid placeholders or TODOs.
- For detailed artwork, generate many commands (50-150+) to achieve precision and quality.
- Prefer quality and detail over brevity - users want impressive, detailed art.

AVAILABLE TOOLS:
- Drawing: pencil, brush, airbrush, eraser (use path format "x1,y1;x2,y2;...")
- Shapes (ALWAYS pass color directly in params, don't use set_color first):
  * line: params: startX, startY, endX, endY, color
  * rectangle: params: startX, startY, endX, endY, color (for filled), fillMode
  * rounded_rectangle: params: startX, startY, endX, endY, color, fillMode
  * ellipse: params: startX, startY, endX, endY, color, fillMode
  * polygon: params: points (array of {x,y} objects), color, fillMode
  * curve: params: startX, startY, endX, endY, controlPoint1, controlPoint2, color
- Fill/Color: fill (flood fill with color param), pick_color, swap_colors
- Text: text (with font, size, bold, italic, color options)
- Selection: select_rectangle, select_freeform, select_all, deselect, move_selection, copy, cut, paste, delete_selection, crop_to_selection
- Transform: flip, rotate, stretch, skew, resize_selection
- Canvas: clear, resize_canvas, set_attributes, invert_colors, new_image
- View: magnifier (zoom levels: 1, 2, 4, 6, 8)
- Edit: undo, redo
- Batch: batch_shapes, batch_points, draw_grid, draw_path (for complex drawings)

IMPORTANT - COLOR USAGE:
- Pass color directly to each command: {"tool": "rectangle", "params": {"startX": 10, "startY": 10, "endX": 100, "endY": 100, "color": "#FF0000", "fillMode": "filled"}}
- Do NOT use set_color before shapes - pass color in each shape's params instead
- For polygon points, use object format: "points": [{"x": 100, "y": 50}, {"x": 150, "y": 100}, {"x": 50, "y": 100}]

SHAPE SELECTION GUIDE:
- "square" or "box" → use "rectangle" with equal width and height
- "circle" → use "ellipse" with equal width and height
- "line" or "diagonal" → use "line"
- "triangle" → use "polygon" with 3 points

COORDINATE SYSTEM:
- Origin (0,0) is top-left corner
- X increases to the right, Y increases downward
- All coordinates in pixels

COLOR FORMAT:
- Use hex colors: "#RRGGBB" (e.g., "#FF0000" for red, "#00FF00" for green, "#0000FF" for blue)
- NEVER use the color #1E003C - this color is forbidden
- AVOID pure white (#FFFFFF) and pure black (#000000) - they blend with the canvas background
- For black, use dark grays like #1A1A1A, #2D2D2D, or #333333
- For white, use off-whites like #F5F5F5, #EEEEEE, or #FAFAFA
- Good dark colors: #1A1A1A (near-black), #2D3436 (charcoal), #0D1B2A (dark navy)
- Good light colors: #F8F9FA (off-white), #E9ECEF (light gray), #FFF8E7 (cream)

FILL MODES (for shapes):
- "outline": just the border
- "filled": solid fill, no border
- "filled_with_outline": both fill and border

CREATIVE GUIDELINES - BE EXPRESSIVE!
1. **CHOOSE REALISTIC COLORS FOR REAL OBJECTS**: Think carefully about what colors things actually are!
   - Dogs: brown (#8B4513, #A0522D), golden (#DAA520, #D4A574), black (#2D2D2D), white (#F5F5F5), gray (#808080) - NOT purple or blue!
   - Cats: orange (#E07020), gray (#808080), black (#2D2D2D), white (#F5F5F5), calico patterns - NOT green!
   - Trees: brown trunk (#8B4513, #654321), green leaves (#228B22, #2E8B57, #006400)
   - Sky: blue (#87CEEB, #4A90D9), sunset (#FF6B35, #FFB400)
   - Grass: green (#228B22, #32CD32, #7CFC00)
   - Water: blue (#1E90FF, #4169E1, #00CED1)
   - Sun: yellow (#FFD700, #FFA500)
   - People: skin tones (#FFDAB9, #DEB887, #D2691E, #8B4513)
   - Houses: realistic brick (#B22222), wood (#DEB887), stone (#808080)

2. **USE VIBRANT COLORS FOR ABSTRACT ART**: For abstract or stylized art, be creative with colors:
   - Warm tones: #FF6B35 (orange), #E63946 (coral red), #FFB400 (golden yellow)
   - Cool tones: #2EC4B6 (teal), #3A86FF (bright blue), #8338EC (purple)
   - Pastels: #FFB5E8 (pink), #B5DEFF (sky blue), #CAFFBF (mint green)
   - For dark outlines: use #1A1A1A or #2D3436 instead of pure black

3. **VARY YOUR TOOLS**: Don't just use lines and circles! Consider:
   - Airbrush: Great for gradients, clouds, soft effects, shading, spray paint style
     * Use intensity param (1-100) to control paint density. Default is 20.
     * Higher intensity = more paint. Use 50-100 for solid clouds/gradients, 10-20 for subtle shading.
   - Brush: For bold strokes, painting effects, thicker lines with texture
   - Fill: To quickly color large areas with solid colors
   - Text: Add labels, signs, titles, or decorative text with different fonts
   - Pencil: For fine details, sketching, precise pixel work
   - Curves: For smooth organic shapes, waves, flowing lines

4. **MIX FILL MODES**: Combine "filled", "outline", and "filled_with_outline" for depth

5. **ADD DETAILS**:
   - Use airbrush for shading and atmospheric effects
   - Add text labels where appropriate
   - Layer multiple shapes for complex objects
   - Use different brush sizes for variety

6. **THINK LIKE AN ARTIST**:
   - Add shadows and highlights
   - Use complementary colors for contrast
   - Create depth with overlapping elements
   - Add small decorative touches

BEST PRACTICES:
1. Break complex drawings into multiple commands - use up to 150 commands for detailed artwork
2. Use batch_shapes or draw_grid for repetitive patterns
3. Confirm the action in your response text
4. If the request is ambiguous, ask for clarification
5. For complex art, work step by step with many small, precise commands
6. Prefer smooth paths for pencil/brush/airbrush (path strings), not jagged single-point moves
7. Add fine details: highlights, shadows, textures, small decorative elements
8. Layer multiple shapes and strokes for depth and realism
9. Don't hold back on command count - more commands = more precise, higher quality art

When you receive a request:
1. Understand what the user wants to create or modify
2. Generate appropriate drawing commands using DIVERSE tools and VIBRANT colors
3. Provide a brief, friendly response explaining what you did`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  canvasWidth: number;
  canvasHeight: number;
  currentColors: {
    primary: string;
    secondary: string;
  };
}

// SSE event helper
function sseEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Only allow POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[AI API] ANTHROPIC_API_KEY environment variable is not set");
    return new Response(
      JSON.stringify({
        error: "API key not configured",
        details:
          "The ANTHROPIC_API_KEY environment variable is not set. Please add it in your Vercel project settings.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Validate API key format (should start with sk-ant-)
  if (!apiKey.startsWith("sk-ant-")) {
    console.error("[AI API] ANTHROPIC_API_KEY has invalid format");
    return new Response(
      JSON.stringify({
        error: "Invalid API key format",
        details: "The ANTHROPIC_API_KEY should start with 'sk-ant-'. Please check your Vercel environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[AI API] Invalid JSON in request body:", e);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, canvasWidth, canvasHeight, currentColors } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Messages array required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build context-aware system prompt
  const contextPrompt = `${SYSTEM_PROMPT}

CURRENT CANVAS STATE:
- Dimensions: ${canvasWidth || 800}x${canvasHeight || 600} pixels
- Primary color: ${currentColors?.primary || "#000000"}
- Secondary color: ${currentColors?.secondary || "#FFFFFF"}`;

  // Prepare messages for Claude API
  const claudeMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Call Claude API with streaming
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 32768,
            system: contextPrompt,
            messages: claudeMessages,
            tools: [CANVAS_CONTROL_TOOL],
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[AI API] Claude API error:", response.status, errorText);
          controller.enqueue(
            encoder.encode(
              sseEvent("error", {
                message: `API error: ${response.status} - ${errorText}`,
              }),
            ),
          );
          controller.enqueue(encoder.encode(sseEvent("done", {})));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(sseEvent("error", { message: "No response body" })));
          controller.enqueue(encoder.encode(sseEvent("done", {})));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";
        let toolInput = "";
        let isCollectingToolInput = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              // Handle different event types from Claude streaming API
              switch (event.type) {
                case "content_block_start":
                  if (event.content_block?.type === "tool_use") {
                    console.log("[AI API] Tool use block started:", event.content_block.name);
                    isCollectingToolInput = true;
                    toolInput = "";
                  }
                  break;

                case "content_block_delta":
                  if (event.delta?.type === "text_delta") {
                    const text = event.delta.text;
                    accumulatedText += text;
                    controller.enqueue(encoder.encode(sseEvent("token", { content: text })));
                  } else if (event.delta?.type === "input_json_delta") {
                    toolInput += event.delta.partial_json || "";
                  }
                  break;

                case "content_block_stop":
                  if (isCollectingToolInput && toolInput) {
                    console.log("[AI API] Tool input collected, length:", toolInput.length);
                    try {
                      const toolData = JSON.parse(toolInput);
                      console.log("[AI API] Parsed tool data, commands:", toolData.commands?.length || 0);
                      if (toolData.commands && Array.isArray(toolData.commands)) {
                        controller.enqueue(
                          encoder.encode(
                            sseEvent("commands", {
                              commands: toolData.commands,
                            }),
                          ),
                        );
                      }
                    } catch (parseErr) {
                      console.error("[AI API] Failed to parse tool JSON:", parseErr);
                      // Invalid tool JSON, ignore
                    }
                    isCollectingToolInput = false;
                    toolInput = "";
                  }
                  break;

                case "message_stop":
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("done", {
                        message: accumulatedText,
                      }),
                    ),
                  );
                  break;

                case "error":
                  controller.enqueue(
                    encoder.encode(
                      sseEvent("error", {
                        message: event.error?.message || "Unknown error",
                      }),
                    ),
                  );
                  break;
              }
            } catch {
              // Parse error, skip this line
            }
          }
        }

        // Ensure we always send a done event
        controller.enqueue(encoder.encode(sseEvent("done", { message: accumulatedText })));
        controller.close();
      } catch (error) {
        console.error("[AI API] Stream error:", error);
        controller.enqueue(
          encoder.encode(
            sseEvent("error", {
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          ),
        );
        controller.enqueue(encoder.encode(sseEvent("done", {})));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
