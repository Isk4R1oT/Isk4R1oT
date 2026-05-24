### Iskariot

**AI Systems Engineer** — inference internals, MCP, agent evaluation.

I build LLM systems where it hurts: scheduler-tuned vLLM serving, multi-LoRA on shared GPUs, MCP servers that survive real agent traffic, and evaluation tooling that treats non-determinism as a first-class signal instead of noise.

#### Currently building

- **[assay](https://github.com/Isk4R1oT/assay)** — gaming-resistant eval harness for Claude Code components (skills, agents, slash-commands). Real numbers, real logic checks.
- **[ctx](https://github.com/Isk4R1oT/ctx)** — *htop for LLM prompts.* Transparent proxy at the LLM-API boundary that x-rays the actually assembled prompt of any agent pipeline.
- **[vecdoctor](https://github.com/Isk4R1oT/vecdoctor)** — `EXPLAIN ANALYZE` for your vector store. Store-agnostic embeddings health, drift detection, index-model mismatch diagnosis. Single static Rust binary, zero config.
- **vernier** *(private — going public soon)* — precision differential instrument for non-deterministic agent behavior.

#### Track record

- 6+ production MCP servers (Bitrix24 analytics, LinkedIn, HeadHunter, RetailCRM, YouGile OSS, Bybit)
- 3 independent inference migrations with **76–84% monthly TCO reduction** (vLLM + GPTQ-4bit + custom scheduler tuning), validated by LLM-as-judge against pre-migration baselines
- Multi-tenant inference on shared GPU via multi-LoRA adapter switching — **~5× hardware utilization** vs naive per-tenant deployment
- Inference stack: vLLM (PagedAttention, chunked-prefill, scheduler tuning, prefix-cache stickiness), GPTQ/AWQ quantization, EAGLE speculative decoding, KV-cache reuse
- Agent stack: LangGraph, MCP/FastMCP, PydanticAI, DSPy, DeepEval

#### Reach

GMT+5 · open to interesting roles, contracts, audits · [Telegram @Ig0Ro4](https://t.me/Ig0Ro4)

<sup>Real name in interviews: Igor Afonin.</sup>
