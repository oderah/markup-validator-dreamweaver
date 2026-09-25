1. Run `git status` to get all the current changes.
2. Combine the current changes with the full diff between the current branch and the default branch (`main` / `master` / upstream), then determine the version the changes should be released under (semver; inspect existing tags and any project version source such as `package.json`).
3. Find where this repo stores release notes. Prefer existing conventions, for example:
   - a `docs/releases/` (or similar) directory of markdown notes
   - an end-user-facing JSON/TS/JS catalog (e.g. `**/releaseNotes.json`, changelog modules under the UI tree)
   Create or update notes in those locations for the determined version. If no convention exists yet, create `docs/releases/` markdown and ask before inventing a second end-user surface.
   - If there have been no release candidates for the determined version, create notes for the first release candidate of that version.
   - If $ARGUMENTS contains "final", create notes for the determined version (no RC).
   - If $ARGUMENTS is empty or generic, create notes for the next release candidate of the determined version.

**Note:** Any end-user-facing notes must be friendly and free of technical jargon.
