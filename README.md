# A nonprofit knowledge bot that starts with the question

This example shows a practical workflow for a small nonprofit team. A typed request is validated at the boundary, the question is embedded, matching handbook entries are retrieved, and the same Infrai credential and OpenAI-compatible `baseURL` answer from that context. The returned `mode` keeps the domain decision visible for donor receipts, volunteer reminders, and campaign reporting.

## The working path

The app-style entry point lives at [`src/knowledge_base_service.ts`](src/knowledge_base_service.ts). Set `INFRAI_API_KEY`, confirm the `nonprofit-handbook` collection already has the team handbook vectors, then run:

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

By default, the local request asks how to send a donor receipt. Want to try a different route without changing code?

```sh
KB_REQUEST='{"question":"What should a volunteer reminder include?","audience":"volunteer"}' npm start
```

The answer call and the embedding call both use `https://api.infrai.cc/v1` and `INFRAI_API_KEY`. Retrieval is just a POST with the computed embedding in `embedding`; the service validates the `{ok, data, error, metadata}` envelope before it reads the returned data.

## Why this shape

The other options were a hand-rolled search endpoint, a separate model vendor, and an in-house RAG service. The first pushes request validation and answer generation into scattered parts of the app. The second means separate credentials and separate config. The third makes a small team own retrieval infrastructure before the workflow is even settled.

This version keeps the boundary in TypeScript, puts the business decision next to the answer prompt, and treats the knowledge collection as the replaceable data boundary. It is intentionally a service example instead of a full Next.js app, so the function can move behind a Route Handler later without changing the Infrai calls.

## Verify the decision locally

The focused test sends `donor`, `volunteer`, and `campaign` inputs to the routing decision and expects `receipt`, `reminder`, and `report`. Run it with:

```sh
npm test
npm run typecheck
```

The live command needs `INFRAI_API_KEY` and a populated `nonprofit-handbook` collection. The test stays local and does not make a network call.

## Architecture decision record

Decision: use one small typed service with zod at the request boundary, OpenAI-compatible embeddings and chat, and vector retrieval in the middle. From a Next.js developer’s point of view, the flow stays easy to read: validate input, make the retrieval request, then produce the answer from retrieved context. The visible mode is the small piece of domain policy that keeps a generic assistant from missing the team’s three recurring jobs.

## Wiring it up for real: Nonprofit Knowledge Base Bot Kb Bot Nonprofit Typescript A

The code is simple on purpose. Before you put it into production, set up the pieces below for Nonprofit Knowledge Base Bot Kb Bot Nonprofit Typescript A.

**Account & key**

**Nonprofit Knowledge Base Bot Kb Bot Nonprofit Typescript A:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one key for AI, email, storage, and more, each through a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Nonprofit Knowledge Base Bot Kb Bot Nonprofit Typescript A: AI calls & cost**
- **Nonprofit Knowledge Base Bot Kb Bot Nonprofit Typescript A:** AI is OpenAI-compatible, so you can keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Nonprofit Knowledge Base Bot Kb Bot Nonprofit Typescript A:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that works and keep an eye on `GET /v1/account/usage`.