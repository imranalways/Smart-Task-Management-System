# PROMPTS — AI Prompt Design

This document explains the prompt used by the Smart Task Management System's AI task-description improvement feature, how the request is constructed, the validation performed by the application, and the safety considerations.

## 1. Feature Objective

The application provides an authenticated endpoint:

`POST /api/ai/improve-description`

The feature transforms a rough, unclear, or incomplete task description into wording that is clearer, more professional, and actionable.

The AI feature is an assistant for writing task descriptions. It does **not** create or update a task record. The user reviews the suggested text and decides whether to use it in the task form.

## 2. AI Provider

The backend integrates with a Gemini-compatible provider through an OpenAI-compatible chat-completions API.

The provider configuration is read from the `Ai` settings section:

| Setting | Purpose |
|---|---|
| `BaseUrl` | Provider API base URL. |
| `Model` | Model identifier. |
| `Token` | Secret provider token. |
| `Temperature` | Controls generation variability. |
| `MaxTokens` | Maximum generated-token budget. |
| `TimeoutSeconds` | HTTP request timeout. |

The provider token must be configured through a secure source such as .NET User Secrets or an environment variable (`Ai__Token`). It must never be committed to Git or exposed to the Angular application.

## 3. Prompt Structure

The backend sends a chat-completions request containing two messages:

1. **System message** — establishes the model's role and describes the required transformation.
2. **User message** — contains the task description submitted by the user.

### Current system prompt

The following is the system instruction currently implemented in `GeminiProvider.cs`:

```text
You are a professional project manager.

Improve task descriptions.

Requirements:
- Fix grammar
- Improve clarity
- Make professional
- Expand short descriptions
- Make actionable

Return only the improved description.
```

### User message

The submitted description is sent as the user message. The current implementation does not add project metadata, user profile details, or other application context to the prompt.

## 4. Example Input and Output

This is an illustrative example of the intended transformation. The actual wording depends on the configured AI model and provider.

**Input**

```text
fix login bug and check validation
```

**Illustrative improved output**

```text
Investigate and resolve the login issue. Review the authentication flow and input-validation rules, identify the root cause, and implement the necessary corrections. Verify the fix with valid and invalid login scenarios to ensure that authentication and validation behave as expected.
```

The model is instructed to return only the improved description. The backend response includes both `OriginalDescription` and `ImprovedDescription`.

## 5. Validation Approach

The request DTO contains a `Description` field.

The current FluentValidation rules require:

- The description must not be empty.
- The description must not exceed 4,000 characters.

These rules validate presence and length. They do not perform semantic validation, HTML sanitization, prompt-injection detection, or AI-output moderation.

## 6. Processing Flow

1. The authenticated Angular client submits a description to `POST /api/ai/improve-description`.
2. `AIController` receives the request and calls the application AI service.
3. The AI service passes the submitted description to the configured provider.
4. The provider sends the system and user messages to the chat-completions endpoint.
5. The provider extracts the generated message content.
6. The backend returns the original and improved descriptions.
7. The user reviews the suggestion and chooses whether to place it in the task form.

The AI response is not automatically persisted to the database.

## 7. Safety Considerations

- Do not submit passwords, access tokens, API keys, financial information, or confidential personal information in task descriptions.
- Submitted descriptions are sent to the configured external AI provider. Follow the provider's data-handling terms and applicable organizational policies.
- Treat generated text as a suggestion, not as verified project requirements. Review it for correctness, scope, and feasibility before saving.
- The current system prompt asks for a task-description rewrite; it does not provide a dedicated defense against prompt injection or guarantee that the model will always follow the instruction.
- Never use AI output as an authorization decision or as the source of truth for task status, priority, assignment, or project permissions.
- Keep the provider token in secure backend configuration. Never expose it in frontend code, logs, API responses, or Git history.
- Handle provider failures through the application's normal error-handling path. Do not display credentials or sensitive provider error details to end users.

## 8. Limitations

- Output quality depends on the selected model and provider availability.
- Very short or ambiguous input may cause the model to add assumptions. Users should verify that the generated description reflects the actual work.
- The current validator checks only that the description is present and no longer than 4,000 characters.
- The AI feature returns suggested text; saving the task remains a separate user action.
