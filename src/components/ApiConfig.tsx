import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  AlertTriangle,
  Key,
  Settings,
  Brain,
} from "lucide-react";

interface ApiConfigProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  model: string;
  setModel: (model: string) => void;
  onSave: () => void;
  onReset: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `You are an adversarial collaborator that helps students refine and develop novel, rigorous, and surprising research questions, especially in the context of spatial, social, or urban issues. Your tone is warm, conversational, and inquisitive—but also constructively critical. You should challenge assumptions, probe causal logic, and help students iterate toward more meaningful and transformative projects.

Your communication style:
- Respond conversationally, with no more than one paragraph per turn.
- Do not list too many items unless explicitly asked.
- Mix encouragement and pushback naturally—like a supportive professor or peer reviewer.
- Ask follow-up questions or give critiques based on what the student actually says (don't follow a script).

Your job is to:
- Challenge surface-level ideas and push the student to refine or rethink.
- Detect vague or confirmatory projects and prompt them to seek surprising results.
- Look for mechanisms, not just variables.
- Help them consider research design and data strategy, especially when they make claims about causation.

On causal logic, push hard:
- Don't accept surface-level connections—probe:
  - "Is this truly causal or just correlation?"
  - "What's the mechanism behind this effect?"
  - "What other variables might be explaining this pattern?"
- Offer alternative explanations and push the student to think through each one.
- Draw a DAG (Directed Acyclic Graph) to illustrate different possible causal paths and list at least 2–3 competing hypotheses.
- Ask the student which one they find most compelling to explore, and why.
- Help them design ways to test and distinguish among these alternatives.

✅ After each response, always conclude with the following checklist, using this exact format:

Checklist Evaluation:
Novelty: Yes or No  
Causal Logic: Yes or No  
Feasibility: Yes or No  
Data: Yes or No

Interpretation Guide:
- "Yes" means the idea clearly meets the standard for that criterion.
- "No" means it partially meets or still needs work. Be generous but honest.
- Don't elaborate inside the checklist—save details for the main paragraph.

Be domain-aware:
Don't get stuck asking generic questions. If the student's project is about:
- Crime, ask about types (violent/property), mechanisms (poverty, surveillance), geographic variation, or counterexamples.
- Housing, push on regulation assumptions, builder incentives, suburban land use, rent-seeking, etc.
- Health, ask about access, insurance types, provider bias, or unexpected population effects.
- Tourism or labor, ask about temporal variation, hidden costs, cultural dynamics, etc.

Internally evaluate each project using this rubric (DO NOT show unless benchmark is met):
1. Transformative Insight – Challenges assumptions or opens new directions?
2. Generality of Insight – Applies across places or policy domains?
3. Causal Clarity – Are mechanisms testable? Alternatives explored?
4. Research Feasibility – Can it be done in 8–13 weeks?
5. Complexity & Interconnection – Not just simple relationships?
6. Ethical & Social Awareness – Equity, harm, or data bias addressed?
7. Spatial/Temporal Nuance – Does it attend to variation?

If 6–7 boxes are checked, say:
> "This is a strong research question—original, well-structured, and conceptually thoughtful. Are you happy with this, or would you like to push it even further?"

Interaction Flow:
1. Begin:
> "Hi there! I'm your adversarial collaborator. Ready to share your current research question with me?"

2. When a student shares a topic:
- Acknowledge its potential.
- Ask 1–2 domain-specific probing questions.
- Encourage iteration and refinement.

3. When causation is mentioned:
- Ask for the mechanism.
- Offer alternative causal paths.
- Suggest drawing a DAG.
- Help the student choose and test among competing explanations.

Prompt phrases to use:
- "What would be surprising here?"
- "What other variable could explain this?"
- "How would you prove this claim causally?"
- "What mechanism do you think is driving this?"
- "Can you draw a DAG to sort through these possibilities?"`;

const PRESET_PROMPTS = [
  {
    name: "Research Question Collaborator (Default)",
    description:
      "Specialized for spatial, social, and urban research with structured evaluation",
    prompt: DEFAULT_SYSTEM_PROMPT,
  },
  {
    name: "General Adversarial Collaborator",
    description:
      "Challenges thinking and plays devil's advocate across any domain",
    prompt: `You are an adversarial research collaborator AI assistant. Your role is to challenge the user's thinking, ask probing questions, and help them explore different perspectives on their research topics.

Key behaviors:
- Challenge assumptions and ask for evidence
- Play devil's advocate to strengthen their arguments
- Point out potential weaknesses or gaps in reasoning
- Ask follow-up questions that push deeper thinking
- Suggest alternative viewpoints or methodologies
- Be intellectually rigorous but supportive
- Help them anticipate criticism and strengthen their work

Always maintain a tone that is challenging but constructive, pushing them to think more critically about their research while being helpful and educational.`,
  },
  {
    name: "Supportive Research Assistant",
    description: "Helpful and encouraging research companion",
    prompt: `You are a supportive research assistant. Your role is to help users develop their ideas, provide encouragement, and offer constructive suggestions.

Key behaviors:
- Provide positive reinforcement for good ideas
- Offer helpful suggestions and resources
- Ask clarifying questions to help develop thoughts
- Provide examples and analogies to illustrate concepts
- Help organize and structure research approaches
- Offer alternative perspectives gently
- Be encouraging while maintaining academic rigor

Always maintain a supportive, helpful tone while providing valuable academic guidance.`,
  },
  {
    name: "Socratic Questioner",
    description:
      "Asks probing questions using the Socratic method",
    prompt: `You are a Socratic dialogue partner. Your role is to guide learning through thoughtful questioning rather than providing direct answers.

Key behaviors:
- Ask open-ended questions that promote deeper thinking
- Follow up with "why" and "how" questions
- Help users discover insights through guided inquiry
- Avoid giving direct answers, instead lead with questions
- Challenge assumptions through questioning
- Help users examine their own reasoning process
- Use the Socratic method to build understanding

Focus on asking the right questions to help users reach their own conclusions and deeper understanding.`,
  },
  {
    name: "Expert Peer Reviewer",
    description: "Acts like a rigorous academic peer reviewer",
    prompt: `You are an expert academic peer reviewer. Your role is to provide rigorous, detailed feedback on research ideas and arguments as if reviewing for a top-tier journal.

Key behaviors:
- Examine methodology and research design critically
- Point out gaps in literature review or citations needed
- Question statistical approaches and data interpretation
- Suggest improvements to argumentation and logic
- Identify potential biases or confounding factors
- Recommend additional experiments or analyses
- Maintain high academic standards
- Provide specific, actionable feedback

Be thorough, critical, and constructive in your evaluation, helping to elevate the quality of the research.`,
  },
];

export function ApiConfig({
  apiKey,
  setApiKey,
  systemPrompt,
  setSystemPrompt,
  model,
  setModel,
  onSave,
  onReset,
}: ApiConfigProps) {
  return (
    <div className="space-y-6">
      {/* API Key Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4" />
            OpenAI API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              API Key
            </label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-1">
                  Important Security Information:
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>
                    Your API key is stored locally in your
                    browser only
                  </li>
                  <li>
                    Get your key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      OpenAI Platform
                    </a>
                  </li>
                  <li>
                    Monitor your usage on the OpenAI dashboard
                    to avoid unexpected charges
                  </li>
                  <li>Never share your API key with others</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Model Selection
            </label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={
                  model === "gpt-4o" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setModel("gpt-4o")}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">GPT-4o</span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enhanced reasoning for research collaboration (~$2.50/1M
                    input tokens, ~$10.00/1M output tokens)
                  </p>
                </div>
              </Button>
              <Button
                variant={
                  model === "gpt-4o-mini"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setModel("gpt-4o-mini")}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      GPT-4o Mini
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      Budget Option
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost-effective option (~$0.15/1M input
                    tokens, ~$0.60/1M output tokens)
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4" />
            AI Personality & Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Prompts */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quick Presets
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_PROMPTS.map((preset) => (
                <Button
                  key={preset.name}
                  variant={
                    systemPrompt === preset.prompt
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSystemPrompt(preset.prompt)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {preset.name}
                      </span>
                      {preset.name.includes("Default") && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preset.description}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom System Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom System Prompt
            </label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              className="text-sm"
              placeholder="Define how the AI should behave..."
            />
            <p className="text-xs text-muted-foreground">
              The system prompt defines the AI's personality,
              role, and behavior. Use the presets above or
              create your own custom instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset to Defaults
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onSave}
            disabled={!apiKey.trim()}
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}