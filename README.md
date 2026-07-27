<div align="center">

<img src="assets/hero.svg" alt="Iskariot — AI Systems Engineer. Animated schematics of the serving stack; the running order changes daily." width="100%">

</div>

I work across the whole AI stack — serving and inference internals, agent runtimes and orchestration, evaluation and tracing, and the backend and interface that make any of it usable. I take the whole thing, not one layer of it.

Everything below is something I needed and couldn't buy. Most of them are instruments: they measure a part of the stack nobody else is looking at.

<br>

<div align="center"><h3>The instruments</h3></div>

<table>
<tr>
<td width="50%" valign="top">

#### [vernier](https://github.com/Isk4R1oT/vernier) · `Rust`
A differential instrument for non-deterministic agents. Records N runs at the model-API wire, fingerprints the variance one run hides, and names the **first divergent step**.

</td>
<td width="50%" valign="top">

#### [ctx](https://github.com/Isk4R1oT/ctx) · `Rust`
*htop for LLM prompts.* Transparent proxy at the LLM-API boundary that x-rays the prompt a pipeline **actually** assembled — not the one you think it did.

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### [edp](https://github.com/Isk4R1oT/edp) · `Python`
**Explicit Decision Protocol.** Agents make decisions and then quietly contradict them. This makes the decision a first-class object the agent has to remember and respect.

</td>
<td width="50%" valign="top">

#### [vecdoctor](https://github.com/Isk4R1oT/vecdoctor) · `Rust`
`EXPLAIN ANALYZE` for your vector store. Store-agnostic embeddings health, drift detection, index-model mismatch diagnosis. Single static binary, zero config.

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### [claude-quant](https://github.com/Isk4R1oT/claude-quant) · `Python`
A full agentic system, not a demo: Agent SDK orchestrator with multi-model subagent fan-out, six trading skills, prompt caching and persistent memory, wired to live perpetuals.

</td>
<td width="50%" valign="top">

#### [Plinth](https://github.com/Isk4R1oT/Plinth) · `TypeScript`
Marketplace for hosted AI agents — host, proxy, meter and bill black-box `/invoke` agents. Runtime, billing and product surface, all of it mine.

</td>
</tr>
</table>

<div align="center"><sub>MCP servers, Claude Code plugins, eval harnesses and inference tooling —
<a href="https://github.com/Isk4R1oT?tab=repositories">the rest of the shelf</a>.</sub></div>


<br>

<div align="center"><h3>The other half of the stack</h3></div>

The plates above are the serving layer. This is what I build on top of it — runtime, memory, isolation, orchestration.

<div align="center">

<img src="assets/hero-agents.svg" alt="Agent runtime plates — decision drift, compaction, memory, isolation, orchestration." width="100%">

</div>

<br>

<div align="center"><h3>Every plate, on demand</h3></div>

<sub>The heroes above play on their own. If you would rather pick, open one.</sub>

<details>
<summary><b>Serving stack</b> — 11 plates, open any of them</summary>
<br>

<sub>Schematics of mechanisms, plus three plates carrying my own measurements.</sub>

<details>
<summary><code>01</code> &nbsp; <b>THE ROOFLINE</b> — <sub>the regime is set by batch size, not by model size</sub></summary>
<br>
<img src="assets/plates/roofline.svg" alt="THE ROOFLINE" width="100%">
</details>

<details>
<summary><code>02</code> &nbsp; <b>A TENSOR CORE, MOSTLY DARK</b> — <sub>speculation is free because the silicon was already idle</sub></summary>
<br>
<img src="assets/plates/tensor-core-dark.svg" alt="A TENSOR CORE, MOSTLY DARK" width="100%">
</details>

<details>
<summary><code>03</code> &nbsp; <b>THE KNEE</b> — <sub>nothing measured below the knee predicts what is above it</sub></summary>
<br>
<img src="assets/plates/knee.svg" alt="THE KNEE" width="100%">
</details>

<details>
<summary><code>04</code> &nbsp; <b>THE BOUNDARY</b> — <sub>disaggregation pays in the middle of the curve, and only there</sub></summary>
<br>
<img src="assets/plates/boundary.svg" alt="THE BOUNDARY" width="100%">
</details>

<details>
<summary><code>05</code> &nbsp; <b>THE CACHE THAT FILLS ITSELF</b> — <sub>prefix match alone queues the hottest node</sub></summary>
<br>
<img src="assets/plates/self-filling-cache.svg" alt="THE CACHE THAT FILLS ITSELF" width="100%">
</details>

<details>
<summary><code>06</code> &nbsp; <b>EXPERT ROUTING · DISPATCH / COMBINE</b> — <sub>the router convention differs by model and fails silently</sub></summary>
<br>
<img src="assets/plates/moe-dispatch.svg" alt="EXPERT ROUTING · DISPATCH / COMBINE" width="100%">
</details>

<details>
<summary><code>07</code> &nbsp; <b>A HAND-WRITTEN KERNEL vs cuBLAS</b> — <sub>the last stretch costs as much as everything before it</sub></summary>
<br>
<img src="assets/plates/grouped-gemm.svg" alt="A HAND-WRITTEN KERNEL vs cuBLAS" width="100%">
</details>

<details>
<summary><code>08</code> &nbsp; <b>SAME SEED · STILL DIVERGES</b> — <sub>batch composition changes the order of reductions</sub></summary>
<br>
<img src="assets/plates/determinism.svg" alt="SAME SEED · STILL DIVERGES" width="100%">
</details>

<details>
<summary><code>09</code> &nbsp; <b>THE WEIGHT YOU CANNOT TOUCH</b> — <sub>super weights are not magnitude outliers</sub></summary>
<br>
<img src="assets/plates/super-weight.svg" alt="THE WEIGHT YOU CANNOT TOUCH" width="100%">
</details>

<details>
<summary><code>10</code> &nbsp; <b>WHEN ATTENTION GOES MEMORY-BOUND</b> — <sub>prefill is compute-bound only while the context is short</sub></summary>
<br>
<img src="assets/plates/attention-crossover.svg" alt="WHEN ATTENTION GOES MEMORY-BOUND" width="100%">
</details>

<details>
<summary><code>11</code> &nbsp; <b>COLD START IS A MEMORY PROBLEM</b> — <sub>a memory constraint wearing a latency costume</sub></summary>
<br>
<img src="assets/plates/cold-start.svg" alt="COLD START IS A MEMORY PROBLEM" width="100%">
</details>

</details>

<details>
<summary><b>Agent runtime</b> — 12 plates, open any of them</summary>
<br>

<sub>How I keep long-running agents honest, isolated and cheap.</sub>

<details>
<summary><code>01</code> &nbsp; <b>DECISION DRIFT</b> — <sub>the agent does not forget — it confidently contradicts itself</sub></summary>
<br>
<img src="assets/plates/decision-drift.svg" alt="DECISION DRIFT" width="100%">
</details>

<details>
<summary><code>02</code> &nbsp; <b>CONTEXT COMPACTION</b> — <sub>the loss never shows up on the turn you made it</sub></summary>
<br>
<img src="assets/plates/compaction.svg" alt="CONTEXT COMPACTION" width="100%">
</details>

<details>
<summary><code>03</code> &nbsp; <b>THE META-AGENT</b> — <sub>a platform is judged on how cheap the second agent is</sub></summary>
<br>
<img src="assets/plates/meta-agent.svg" alt="THE META-AGENT" width="100%">
</details>

<details>
<summary><code>04</code> &nbsp; <b>LONG-HORIZON MEMORY</b> — <sub>memory is an eviction policy wearing the costume of a database</sub></summary>
<br>
<img src="assets/plates/long-horizon.svg" alt="LONG-HORIZON MEMORY" width="100%">
</details>

<details>
<summary><code>05</code> &nbsp; <b>THE AGENT THAT PROVES ITS OWN MATH</b> — <sub>it has to demonstrate the number before it may act on it</sub></summary>
<br>
<img src="assets/plates/proven-math.svg" alt="THE AGENT THAT PROVES ITS OWN MATH" width="100%">
</details>

<details>
<summary><code>06</code> &nbsp; <b>THE PII MEMBRANE</b> — <sub>the model never needed the real value to reason</sub></summary>
<br>
<img src="assets/plates/pii-membrane.svg" alt="THE PII MEMBRANE" width="100%">
</details>

<details>
<summary><code>07</code> &nbsp; <b>TOOL CALLS · VALIDATED BEFORE DISPATCH</b> — <sub>90 % valid is a system that breaks every ten turns</sub></summary>
<br>
<img src="assets/plates/tool-validation.svg" alt="TOOL CALLS · VALIDATED BEFORE DISPATCH" width="100%">
</details>

<details>
<summary><code>08</code> &nbsp; <b>CODE EXECUTION, FENCED</b> — <sub>the sandbox is for the mistakes sitting in the input</sub></summary>
<br>
<img src="assets/plates/sandbox.svg" alt="CODE EXECUTION, FENCED" width="100%">
</details>

<details>
<summary><code>09</code> &nbsp; <b>WHERE THE TRUST BOUNDARY ACTUALLY IS</b> — <sub>data read through a tool does not get to give orders</sub></summary>
<br>
<img src="assets/plates/injection-gate.svg" alt="WHERE THE TRUST BOUNDARY ACTUALLY IS" width="100%">
</details>

<details>
<summary><code>10</code> &nbsp; <b>CAPABILITY FAN-OUT</b> — <sub>routing by capability beats a better prompt</sub></summary>
<br>
<img src="assets/plates/fan-out.svg" alt="CAPABILITY FAN-OUT" width="100%">
</details>

<details>
<summary><code>11</code> &nbsp; <b>THE SNAPSHOT WAS ALREADY OLD</b> — <sub>the page stopped existing while the model was thinking</sub></summary>
<br>
<img src="assets/plates/stale-dom.svg" alt="THE SNAPSHOT WAS ALREADY OLD" width="100%">
</details>

<details>
<summary><code>12</code> &nbsp; <b>GOLDEN TASKS · FROZEN, MOCKED, REPLAYED</b> — <sub>a model upgrade is a regression event until proven otherwise</sub></summary>
<br>
<img src="assets/plates/harness.svg" alt="GOLDEN TASKS · FROZEN, MOCKED, REPLAYED" width="100%">
</details>

</details>

<br>

<div align="center"><h3>Stack</h3></div>

<div align="center">

<img src="https://img.shields.io/badge/Rust-161b22?style=flat-square&logo=rust&logoColor=e6edf3" alt="Rust">
<img src="https://img.shields.io/badge/Python-161b22?style=flat-square&logo=python&logoColor=e6edf3" alt="Python">
<img src="https://img.shields.io/badge/TypeScript-161b22?style=flat-square&logo=typescript&logoColor=e6edf3" alt="TypeScript">
<img src="https://img.shields.io/badge/CUDA-161b22?style=flat-square&logo=nvidia&logoColor=e6edf3" alt="CUDA">

<br>

<img src="https://img.shields.io/badge/SGLang-1f6feb?style=flat-square" alt="SGLang">
<img src="https://img.shields.io/badge/vLLM-1f6feb?style=flat-square" alt="vLLM">
<img src="https://img.shields.io/badge/RadixAttention-1f6feb?style=flat-square" alt="RadixAttention">
<img src="https://img.shields.io/badge/GPTQ%20%7C%20AWQ-1f6feb?style=flat-square" alt="GPTQ / AWQ">
<img src="https://img.shields.io/badge/spec--decode-1f6feb?style=flat-square" alt="speculative decoding">
<img src="https://img.shields.io/badge/multi--LoRA-1f6feb?style=flat-square" alt="multi-LoRA">

<br>

<img src="https://img.shields.io/badge/Claude%20Agent%20SDK-238636?style=flat-square" alt="Claude Agent SDK">
<img src="https://img.shields.io/badge/MCP%20%7C%20FastMCP-238636?style=flat-square" alt="MCP / FastMCP">
<img src="https://img.shields.io/badge/LangGraph-238636?style=flat-square" alt="LangGraph">
<img src="https://img.shields.io/badge/PydanticAI-238636?style=flat-square" alt="PydanticAI">
<img src="https://img.shields.io/badge/DSPy-238636?style=flat-square" alt="DSPy">

<br>

<img src="https://img.shields.io/badge/OpenTelemetry-6e40c9?style=flat-square" alt="OpenTelemetry">
<img src="https://img.shields.io/badge/DeepEval-6e40c9?style=flat-square" alt="DeepEval">
<img src="https://img.shields.io/badge/pgvector-6e40c9?style=flat-square" alt="pgvector">
<img src="https://img.shields.io/badge/Postgres-6e40c9?style=flat-square" alt="Postgres">
<img src="https://img.shields.io/badge/FastAPI-6e40c9?style=flat-square" alt="FastAPI">

</div>

<br>

<div align="center"><h3>Signal</h3></div>

<div align="center">

<img src="assets/telemetry.svg" alt="Contribution telemetry" width="100%">

<br><br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Isk4R1oT/Isk4R1oT/output/github-snake-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Isk4R1oT/Isk4R1oT/output/github-snake.svg">
  <img alt="Contribution graph, eaten by a snake" src="https://raw.githubusercontent.com/Isk4R1oT/Isk4R1oT/output/github-snake.svg" width="100%">
</picture>

</div>

<br>

<div align="center"><h3>Reach</h3></div>

<div align="center">

GMT+5 · open to interesting roles, contracts and audits

<a href="https://t.me/Ig0Ro4"><img src="https://img.shields.io/badge/Telegram-0d1117?style=for-the-badge&logo=telegram&logoColor=58a6ff&labelColor=0d1117" alt="Telegram"></a>
<a href="https://github.com/Isk4R1oT?tab=repositories"><img src="https://img.shields.io/badge/All%20repos-0d1117?style=for-the-badge&logo=github&logoColor=e6edf3&labelColor=0d1117" alt="Repositories"></a>

<sub>Real name in interviews: Igor Afonin.</sub>

</div>
