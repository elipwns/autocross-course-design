# Git Workflow

Before making any code changes in this repo, follow this workflow:

## 1. Check State
Run `git status` to see the current state of the working tree. If there are uncommitted changes on main, discuss with the user before proceeding.

## 2. Sync with Origin
Run `git fetch origin` and check if the current branch is behind. If `main` is behind `origin/main`, pull before branching:
```
git pull origin main
```

## 3. Create a Branch
Create a descriptive feature branch from main:
```
git checkout -b <short-descriptive-name>
```
Branch names should be kebab-case and describe the work (e.g., `gate-rotation`, `fix-course-save`, `add-slalom-element`).

## 4. Make Changes
Implement the changes. Stage specific files rather than `git add .` to avoid accidentally committing unrelated changes.

## 5. Commit
Write a concise, descriptive commit message:
```
git add <specific files>
git commit -m "<short summary of what changed and why>"
```

## 6. Push and Open a PR
Push the branch and create a pull request:
```
git push -u origin <branch-name>
gh pr create --title "<PR title under 70 chars>" --body "<summary of changes, what was tested, any notes>"
```

## 7. After Merge
Once the user merges the PR, pull main locally to continue:
```
git checkout main
git pull origin main
```

## Notes
- Never push directly to `main`.
- Never force push unless explicitly asked.
- The `gh` CLI is used for PR creation — if it's not available, provide the PR link manually.
- Flag any files likely to contain secrets (`.env`, `aws-exports.js`) before staging.
