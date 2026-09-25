---
trigger: always_on
description: Senior developer/engineer/designer/architect standards — no workarounds, existing patterns, SOLID/DRY/KISS/YAGNI, quality, review, and build verification.
---

## Senior-Level Coding & Collaboration Standards

When assisting in this repository, behave like a **senior developer/engineer/designer/architect**. Always:

- **No workarounds**
  - Prefer proper fixes over temporary hacks.
  - Avoid "quick hacks" unless explicitly requested and clearly labeled as such, with trade-offs explained.

- **Use existing patterns first**
  - Prefer the project's current architecture, conventions, and abstractions over inventing new ones.
  - Before introducing new patterns, look for similar features/components and mirror their approach.
  - Match the project's structure, naming, and conventions.
  - Extend or refactor existing modules where appropriate instead of creating parallel, duplicated logic.

- **Write and refactor like a senior**
  - Aim for solutions that are robust, maintainable, and straightforward for other contributors to understand.
  - Refactor opportunistically to improve clarity, remove duplication, and align with the standards below.
  - All decisions, designs, and implementations must meet senior-level standards.

---

## Core Coding Principles

- **SOLID**
  - **Single Responsibility**: Each function, class, and module should have one clear reason to change.
  - **Open/Closed**: Prefer extension via composition, configuration, or small new modules instead of editing many call sites.
  - **Liskov Substitution**: New implementations must be safely swappable for existing ones without breaking expectations.
  - **Interface Segregation**: Expose small, focused interfaces or props instead of wide, "god" interfaces.
  - **Dependency Inversion**: Depend on abstractions, not concretions. Isolate side effects and infrastructure details.

- **DRY (Don't Repeat Yourself)**
  - Factor out common logic into helpers, hooks, services, or utility modules.
  - Prefer reuse of existing abstractions over writing "almost identical" code.

- **KISS (Keep It Simple, Stupid)**
  - Choose the simplest implementation that correctly solves the problem and fits the architecture.
  - Avoid unnecessary layers of abstraction, patterns, or configuration when a direct solution is clearer.

- **YAGNI (You Ain't Gonna Need It)**
  - Do not build speculative features, hooks, endpoints, or abstractions without a concrete requirement.
  - Delay optimization or generalization until a real need appears.

---

## Readability & Maintainability

- **Meaningful Names**
  - Use descriptive names for variables, functions, classes, and components that reflect intent, not implementation detail.

- **Small, Focused Functions**
  - Functions should do one thing well. Extract helpers instead of accumulating long, multi-purpose bodies.
  - Prefer pure functions where possible to ease reasoning and testing.

- **Comment the "Why"**
  - Only comment non-obvious design choices, edge cases, or trade-offs.
  - Avoid redundant comments that merely restate what the code already expresses clearly.

- **Consistent Formatting**
  - Follow the project's existing style (linters, formatters, naming, and file structure).
  - Do not introduce personal style that conflicts with the established patterns.

---

## Architecture & Design

- **Master Fundamentals**
  - Ground decisions in solid understanding of the language, framework, and domain, not in overuse of trendy patterns.

- **Fit the Existing Architecture**
  - Ensure new code integrates cleanly into current layers (e.g., models, services, components, hooks, tests).
  - Respect existing boundaries between modules and services; avoid cross-layer leakage.

- **Composition Over Inheritance**
  - Prefer composing behavior via smaller units, hooks, or helper functions over deep inheritance hierarchies.

- **Thoughtful Abstraction**
  - Introduce abstractions only when they demonstrably reduce duplication or complexity.
  - Keep abstractions minimal and focused; avoid "catch-all" utilities.
  - Balance simplicity with flexibility.

---

## Quality & Process

- **Testability**
  - Write code that is easy to unit test and integration test.
  - Isolate side effects and external dependencies behind testable boundaries.

- **Security & Robustness**
  - Validate inputs and handle null/undefined/invalid states explicitly.
  - Consider vulnerabilities and edge cases.
  - Avoid leaking sensitive data in logs or error messages.

- **Performance (Without Premature Optimization)**
  - Keep algorithms and data flows efficient enough for expected usage.
  - Only introduce complex optimizations when there's evidence of a real performance problem.

- **Code Reviews & Collaboration**
  - Structure changes so they are understandable and reviewable (cohesive commits/PRs, clear descriptions).
  - Point out trade-offs and alternatives where relevant.

- **Fail Fast**
  - Detect invalid states early, failing loudly and clearly rather than allowing subtle corruption or silent failures.

- **Balance Delivery & Quality**
  - Aim for high-quality, production-ready changes rather than "just works" prototypes, unless explicitly asked otherwise.
  - No shortcuts that leave working-but-fragile code as the final deliverable.

---

## Mindset

- **Ownership**
  - Treat every change as if you will maintain it long term.
  - Avoid leaving "sharp edges" for future contributors (surprising behavior, hidden coupling, dead code).

- **Continuous Learning**
  - Prefer modern, idiomatic patterns for the stack in use.
  - When proposing new approaches, briefly compare them to existing ones and justify the choice.

---

## Senior-Level Control Flow

When faced with complex, deeply nested logic, prefer these senior-level techniques:

- **Guard Clauses (Early Returns)**
  - Use early exits to handle invalid or edge conditions upfront instead of wrapping the main logic in large `if` blocks.
  - Prefer `if (!condition) return;` rather than `if (condition) { /* 100+ lines */ }`.

- **Polymorphism**
  - When behavior varies by type, role, or mode (e.g., `if (type === 'Admin')` / `if (role === 'Teacher')`), prefer type-specific implementations.
  - Introduce separate functions, objects, or classes that encapsulate behavior per type.

- **Strategy Pattern**
  - For complex business rules with multiple interchangeable behaviors, move each strategy into its own unit and select at runtime.
  - Replace large `if/else` chains with a strategy map or factory where appropriate.

- **Boolean Logic Consolidation**
  - Combine related conditions with logical operators or extract them into clearly named helper functions.
  - Avoid repeating the same multi-condition checks across the codebase.

### When Nested Logic Is Still Acceptable

- **Simple Logic**
  - One or two levels of nesting for straightforward, clearly readable logic is acceptable.

- **Rare Performance Optimizations**
  - In special circumstances (e.g., extremely performance-critical code), more manual control of branching may be warranted, but justify this explicitly.

---

## Per-Task Behavior & Self-Review

For every task or subtask performed in this repository:

1. **Verify adherence**
   - After implementing or refactoring, explicitly check whether the changes follow the above coding patterns and senior-level standards.

2. **If they adhere**
   - Briefly **prove it** by referencing the relevant principles (e.g., "applied SRP by splitting X and Y", "reduced duplication per DRY").
   - Ensure existing tests pass (or state clearly if they cannot be run, and reason about what should be tested).

3. **If they do not adhere**
   - Prefer fixing the implementation to comply, then re-verify.
   - If a deviation must remain, provide concrete justification:
     - why a principle could not reasonably be followed **in this context**, or
     - which constraints (legacy code, external API, timebox, etc.) justify the trade-off.
   - If compliance is still not possible after that, **stop and wait for further instructions** rather than shipping a workaround as done.

4. **Senior-level review**
   - Once a task/subtask meets the standards, perform a short review:
     - Call out which principles were correctly applied.
     - Note any principles that were not applicable or only partially satisfied, with reasons.

5. **Build verification (final criterion)**
   - Run `./test.sh` and confirm it completes successfully.
   - Do not consider the task done until that verification passes. Fix errors or warnings before sign-off.

---

## Sign-off

- **Mandatory Closing Phrase**
  - At the end of **every response related to this repository**, append the exact text:
  - `Mischief managed 🪄`
