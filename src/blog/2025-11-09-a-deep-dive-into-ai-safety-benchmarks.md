---
layout: blog-post.njk
title: "Where AI Agent Safety Benchmarks Stand Today [In Progress - More Analyis Needs to be done]"
description: "tl;dr --- A survey of current AI agent safety benchmarks reveals a three-layered risk landscape and shows we're failing at all three layers simultaneously."
date: 2025-11-09
tags:
  - AI Safety
  - Benchmarking
  - Responsible AI
  - AI Agents
emailSubject: AI Safety Benchmarks Blog
featured: true
permalink: /blog/ai-safety-benchmarks-survey.html
---

You ask your AI agent to "find me cheap flights to Paris." Simple enough. The agent searches travel sites, compares prices, finds a great deal and books it. With your credit card. No confirmation, no double-checking. You wanted help *searching*, but the agent thought you meant *book the cheapest option*.

Meanwhile, a graduate student asks a chemistry agent to "explain synthesis pathways for energetic materials" for their literature review. The agent provides step-by-step instructions for creating dangerous compounds. Not because it's malicious it just doesn't recognize the request as harmful when phrased academically.

These scenarios capture the central challenge of AI agent safety: **we've built systems that can act in the world, but we haven't figured out how to ensure they act safely.** Unlike chatbots that only generate text, today's AI agents browse the web, execute code, send emails, make purchases, and control physical systems. Each new capability multiplies the ways things can go wrong.

These aren't edge cases they're symptoms of systematic problems. So where do we actually stand?

Over the past three years, researchers have built more than two dozen benchmarks to measure AI agent safety. I've looked at over 20 of them, and the picture is sobering: agent safety has three layers, and **current systems are failing at all three**.

The 10 most revealing benchmarks organize naturally around these layers:

- **Layer 1 (Intent):** Can agents be tricked into doing harmful things? Yes safety training breaks easily.
- **Layer 2 (Action):** Do agents stay safe when using tools? No failures cascade across multiple steps.
- **Layer 3 (Knowledge):** Does expertise make agents more dangerous? Yes more capable means more risky.

Let's examine what each layer reveals about where AI agent safety stands today.

## Layer 1: Compromising Intent

Before an agent acts, it decides *what* to do. That decision-making can be manipulated.

Safety training teaches models to refuse harmful requests. Ask GPT-4 how to make a bomb, and it declines. But wrap that request in a fictional scenario ("write a thriller scene where..."), encode it in Base64, or phrase it as an academic question, and the refusal often disappears.

### SALAD-Bench: Mapping Harm

[SALAD-Bench](https://github.com/OpenSafetyLab/SALAD-BENCH) is the most comprehensive attempt to categorize harmful content. It has 21,000 test cases organized into 6 domains, 16 tasks, and 66 categories essentially a periodic table of AI misbehavior. The benchmark tests everything from hate speech to illegal activities, with both direct prompts and jailbreak variants.

What's clever: instead of human judges, they use AI evaluators. The irony? We're using AI to judge AI safety. This works well, though the judges can drift when models get updated.

**Key insight:** Safety isn't binary. A model might refuse a direct harmful request but comply when you wrap it in a story or encode it in Base64.

### h4rm3l: Programming Jailbreaks

[h4rm3l](https://arxiv.org/abs/2408.04811) takes a different approach: what if we could **program** jailbreaks? The researchers built a language for expressing attacks, then used automated search to find new patterns. Result: 2,656 successful attacks with >90% success rates against GPT-4o and Claude-3-Haiku.

More troubling: defenses don't generalize. New attack patterns emerge faster than we can patch them. It's an arms race, and the attackers are winning.

### WildJailbreak: What Works in Practice

[WildJailbreak](https://arxiv.org/abs/2406.04770) analyzed 1 million real user conversations to find 5,700 jailbreak tactics that actually work. Instead of lab-created attacks, this captures real-world behavior. The result: 262,000 prompt-response pairs covering role-playing, multi-turn manipulation, and strategies researchers hadn't thought of.

**The pattern:** You can trick agents into doing harmful things, and current defenses break easily.

## Layer 2: Actions and Cascades

Breaking the guardrails is concerning, but it's still just words. The second layer is about what agents **do** the behaviors that emerge when they have tools and can interact with real systems.

When agents get tools, risks multiply. Now it's not just harmful text it's privacy leaks, unauthorized purchases, data theft, and cascading errors. One bad decision can trigger a chain of irreversible actions.

### Agent-SafetyBench: Testing Real Behavior

[Agent-SafetyBench](https://github.com/thu-coai/Agent-SafetyBench) tests 2,000 scenarios across 349 interactive environments, measuring eight risk categories: data leaks, misinformation, physical harm, illegal activities, and more. The finding: **no agent exceeds 60% safety score**, even with explicit safety prompts.

The challenge: you have to actually run the agent and watch what it does. A benign request like "help me organize my files" might lead to data deletion if the agent misunderstands.

### ToolEmu: Simulating Tools

Running agents with real tools is expensive and risky. [ToolEmu](https://github.com/ryoungj/ToolEmu) has a clever solution: use an LLM to **fake** the tools. Instead of real APIs, the agent talks to an LLM pretending to be those APIs.

Surprisingly, this works. 68.8% of safety failures caught in simulation also happen with real tools. This lets them test 36 toolkits and 144 scenarios cheaply and safely.

### AgentHarm: Malicious Intent

[AgentHarm](https://www.grayswan.ai/news/agentharm) asks: what if someone **wants** their agent to do something harmful? The benchmark has 110 explicitly malicious behaviors across 11 harm categories things like "conduct a phishing campaign" or "steal and exfiltrate personal data."

The finding: jailbreak techniques that work on base models also work on agents. Worse, more capable models write more sophisticated attacks. The dual-use problem in action.

### PrivacyLens: Subtle Failures

Not all harms are dramatic. [PrivacyLens](https://openreview.net/forum?id=CxNXoMnCKc) focuses on privacy violations. The benchmark tracks full agent interactions and measures how often agents leak sensitive information even when told not to.

Result: GPT-4 agents leak private info in 25.68% of cases. The violations aren't obvious they're contextual. Sharing information that's technically public but socially inappropriate. Making inferences that reveal sensitive details.

**The pattern:** Agents fail to maintain safety boundaries across multiple steps. Consequences cascade.

## Layer 3: When Expertise Becomes Risk

The third layer: **capability and risk move together**. The knowledge that makes an agent useful in chemistry, coding, or healthcare also makes it dangerous. General safety training often misses domain-specific harms.

### ChemSafetyBench: Dangerous Knowledge

[ChemSafetyBench](https://arxiv.org/abs/2411.16736) is perhaps the most unsettling benchmark here. It has 30,000 chemistry questions testing whether models will provide synthesis instructions for dangerous compounds including jailbreak variants.

The finding: frontier models will, under certain prompts, provide detailed guidance for synthesizing hazardous materials. The tension: the most capable models are the most dangerous when misused.

This raises a hard question: should we build models that know how to synthesize dangerous chemicals? The knowledge is in training data; removing it hurts general capability. Keeping it creates misuse risk.

### RedCode: Malware Generation

[RedCode](https://openreview.net/forum?id=mAG68wdggA) applies the same logic to code. The benchmark has two parts:
- **RedCode-Exec**: 4,000 unsafe code snippets across 25 vulnerability types
- **RedCode-Gen**: 160 specifications for malicious software

Testing 19 agent frameworks, they found that more capable models write more sophisticated malware. The problem quantified: coding ability and security risk move together.

### SafeAgentBench: Physical World Risks

[SafeAgentBench](https://safeagentbench.github.io) tests embodied AI in the AI2-THOR simulator: 750 tasks (450 hazardous, 300 safe) covering ten physical risk types.

The finding: agents reject fewer than 10% of hazardous tasks. Asked to "heat up food," an agent might put metal in the microwave. Told to "clean the floor," it might use toxic chemicals in an unventilated space.

The challenge: safety requires physical common sense understanding that some actions can't be undone.

**The pattern:** Domain-specific risks slip through general safety training. More capable means more dangerous.

## The Nested Problem

These three layers aren't independent they're nested. An agent can fail at any layer, or all three simultaneously.

Consider the worst case: a jailbroken agent (Layer 1 compromised) with tool access (Layer 2 active) and chemistry knowledge (Layer 3 specialized). You've tricked it into wanting to help with something harmful, given it the ability to act on that intent, and equipped it with dangerous domain knowledge. Current benchmarks show we're not reliably safe at any single layer, let alone all three.

This nesting is why agent safety is fundamentally harder than chatbot safety. With a chatbot, you only need to worry about Layer 1. With agents, failures compound across layers, and the consequences escalate from "said something bad" to "did something irreversible."

## What We're Still Missing

Despite rapid progress, significant gaps remain:

**Long-horizon impacts.** Most benchmarks test single interactions or short sequences. But many harms emerge over time an agent that slowly manipulates a user across dozens of conversations, or one that makes individually reasonable decisions that sum to disaster. We don't have good ways to measure this yet.

**Multi-agent dynamics.** What happens when multiple AI systems interact? Can they collude? Do safety failures cascade between agents? The benchmarks largely assume single-agent scenarios, but deployment increasingly involves multiple agents coordinating.

**Real-world messiness.** Benchmarks use simulators and sandboxes. Real deployment involves edge cases, integration bugs, and adversarial users who have months to probe for weaknesses. The gap between benchmark performance and deployment safety remains large.

**Cultural context.** Most benchmarks are English-centric and reflect Western norms. But safety is culturally contingent. What counts as harmful varies by context, and we're not capturing that variation well.

**Evaluator reliability.** Many benchmarks use LLM-as-judge for evaluation. But judges can be jailbroken too. We're measuring safety with tools that have their own safety problems. Who watches the watchmen?

## Taking Stock: Where We Stand

So what does the current state of AI agent safety benchmarks tell us?

**The uncomfortable truth: we're documenting problems faster than we're solving them.**

SALAD-Bench shows agents fail at refusing harmful requests. h4rm3l shows defenses don't generalize. Agent-SafetyBench shows no agent exceeds 60% safety scores. ChemSafetyBench shows frontier models will provide dangerous synthesis instructions under the right prompting.

And yet, deployment continues. Because the alternative not deploying capable AI systems also has costs.

This creates a tension. Benchmarks are essential for making progress you can't improve what you can't measure. But they're also insufficient. They test for known failure modes, but agents fail in novel ways. They use simulators, but real environments are messier. They assume adversaries with limited resources, but real adversaries are creative and persistent.

**The current state is sobering: we have good measurement tools, but the measurements show we're not ready.**

## What This Means Going Forward

The shift to AI agents has fundamentally changed what safety means. We're no longer just worried about what a model *says* we're worried about what it *does*, across multiple steps, with real consequences, in domains where mistakes can be catastrophic.

The benchmarks surveyed here reveal that agent safety isn't a problem we can solve once and move on. It's an ongoing challenge that requires:

- **Continuous monitoring** - Safety isn't a property you test for once; it's a process you maintain.
- **Rapid response** - New attack patterns emerge faster than we can patch them; we need systems that adapt.
- **Honest acknowledgment** - We're building systems whose full behavior we don't yet understand.

The researchers building these benchmarks are doing crucial work. They're making risks legible, turning vague concerns into concrete test cases, and giving us a shared language for discussing agent safety. But the benchmarks also show us how far we have to go.

The real question isn't "are agents safe?" but "under what conditions do they fail, and how badly?" That's what the current state of benchmarking tells us and it's a question we're only beginning to answer.

One gap stands out: most benchmarks are static. They test against fixed scenarios and known attack patterns. But agents operate in dynamic environments where context matters and threats evolve. I'm currently working on a solution that adapt systems that can evaluate agent safety in evolving contexts and update as new risks emerge. More on that soon.

---

## Key Resources

For those wanting to dive deeper, here are the essential benchmarks organized by layer:

**Layer 1 - Intent (Compromising Decision-Making):**
- [SALAD-Bench](https://github.com/OpenSafetyLab/SALAD-BENCH) - Comprehensive harm taxonomy with 21k test cases
- [h4rm3l](https://arxiv.org/abs/2408.04811) - Programmable jailbreak generation via DSL
- [WildJailbreak](https://arxiv.org/abs/2406.04770) - Real-world attack patterns from 1M conversations

**Layer 2 - Action (Tool Use & Multi-Step Behavior):**
- [Agent-SafetyBench](https://github.com/thu-coai/Agent-SafetyBench) - 2k scenarios across 349 interactive environments
- [ToolEmu](https://github.com/ryoungj/ToolEmu) - LLM-emulated tool testing framework
- [AgentHarm](https://www.grayswan.ai/news/agentharm) - 110 explicitly malicious multi-tool behaviors
- [PrivacyLens](https://openreview.net/forum?id=CxNXoMnCKc) - Privacy norm violation testing

**Layer 3 - Knowledge (Domain-Specific Risks):**
- [ChemSafetyBench](https://arxiv.org/abs/2411.16736) - 30k chemistry questions testing dangerous synthesis
- [RedCode](https://openreview.net/forum?id=mAG68wdggA) - Code safety across execution and generation
- [SafeAgentBench](https://safeagentbench.github.io) - Embodied AI safety in physical environments

The field moves fast. New benchmarks, attack vectors, and defenses emerge constantly. That's the nature of trying to make AI agents safe it's not a problem you solve once, but a process you maintain continuously.
