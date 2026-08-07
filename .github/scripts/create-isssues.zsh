#!/usr/bin/env zsh

set -euo pipefail

REPO="ShreeshCS/Teco"
MILESTONE="Production"

echo "Creating Production Readiness issues..."

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"

  if gh issue list \
      --repo "$REPO" \
      --search "\"$title\" in:title" \
      --limit 1 \
      --json title \
      | grep -q "\"$title\""; then
    echo "✓ $title already exists"
    return
  fi

  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --label "$labels" \
    --milestone "$MILESTONE" \
    --body "$body"

  echo "✓ Created: $title"
}

###############################################################################
# Issue 1
###############################################################################

create_issue \
"Infrastructure: Configure Global Error Handling" \
"epic,backend,api,priority:high" \
"## Goal

Implement consistent error handling across the backend.

## Scope

- Global error middleware
- Standard API error format
- Logging unexpected exceptions

## Acceptance Criteria

- [ ] Errors return consistent JSON responses
- [ ] Stack traces are hidden in production
- [ ] Unhandled exceptions are logged

## Learning Difficulty

Medium"

###############################################################################
# Issue 2
###############################################################################

create_issue \
"Infrastructure: Improve Request Validation" \
"epic,backend,api,priority:medium" \
"## Goal

Validate all incoming requests before processing.

## Scope

- Validate request bodies
- Validate query parameters
- Validate route parameters

## Acceptance Criteria

- [ ] Invalid requests return 400
- [ ] Validation messages are descriptive

## Learning Difficulty

Low"

###############################################################################
# Issue 3
###############################################################################

create_issue \
"Infrastructure: Configure Structured Logging" \
"epic,backend,enhancement,priority:medium" \
"## Goal

Introduce structured application logging.

## Scope

- Request logging
- Error logging
- Log levels
- Production configuration

## Acceptance Criteria

- [ ] Requests logged
- [ ] Errors logged
- [ ] Configurable log level

## Learning Difficulty

Medium"

###############################################################################
# Issue 4
###############################################################################

create_issue \
"Infrastructure: Add Health Check Endpoint" \
"epic,backend,api,priority:low" \
"## Goal

Provide an endpoint to verify service health.

## Scope

- GET /health
- Database connectivity check
- Health response format

## Acceptance Criteria

- [ ] Health endpoint returns 200
- [ ] Database connectivity verified

## Learning Difficulty

Low"

###############################################################################
# Issue 5
###############################################################################

create_issue \
"DevOps: Dockerize Backend" \
"epic,deployment,priority:medium" \
"## Goal

Containerize the backend service.

## Scope

- Dockerfile
- Environment variables
- Production image

## Acceptance Criteria

- [ ] Backend builds successfully
- [ ] Container starts correctly

## Learning Difficulty

Medium"

###############################################################################
# Issue 6
###############################################################################

create_issue \
"DevOps: Dockerize Frontend" \
"epic,deployment,priority:medium" \
"## Goal

Containerize the frontend application.

## Scope

- Dockerfile
- Production build
- Static asset serving

## Acceptance Criteria

- [ ] Frontend builds successfully
- [ ] Container serves application

## Learning Difficulty

Medium"

###############################################################################
# Issue 7
###############################################################################

create_issue \
"DevOps: Configure GitHub Actions CI" \
"epic,ci,testing,priority:medium" \
"## Goal

Automate quality checks for every push and pull request.

## Scope

- Install dependencies
- Lint
- Build
- Verify workflow

## Acceptance Criteria

- [ ] Workflow passes
- [ ] Build verified
- [ ] Lint executed

## Learning Difficulty

Medium"

###############################################################################
# Issue 8
###############################################################################

create_issue \
"DevOps: Prepare Deployment Configuration" \
"epic,deployment,priority:medium" \
"## Goal

Prepare the application for deployment.

## Scope

- Production environment variables
- Deployment documentation
- Build configuration

## Acceptance Criteria

- [ ] Deployment documented
- [ ] Production configuration verified

## Learning Difficulty

Medium"

###############################################################################
# Issue 9
###############################################################################

create_issue \
"Documentation: Update Project README" \
"epic,documentation,priority:low" \
"## Goal

Document the project for contributors and users.

## Scope

- Setup instructions
- Architecture overview
- Tech stack
- Development workflow

## Acceptance Criteria

- [ ] README updated
- [ ] Local setup documented

## Learning Difficulty

Low"

###############################################################################
# Issue 10
###############################################################################

create_issue \
"Documentation: Document REST API" \
"epic,documentation,api,priority:low" \
"## Goal

Document all REST API endpoints.

## Scope

- Authentication APIs
- Conversation APIs
- Messaging APIs
- Error responses

## Acceptance Criteria

- [ ] Every endpoint documented
- [ ] Example requests included

## Learning Difficulty

Low"

###############################################################################
# Issue 11
###############################################################################

create_issue \
"Quality: Accessibility Review" \
"epic,frontend,ui,priority:low" \
"## Goal

Improve accessibility across the application.

## Scope

- Keyboard navigation
- Screen reader support
- Color contrast
- Focus states

## Acceptance Criteria

- [ ] Keyboard navigation works
- [ ] Major accessibility issues resolved

## Learning Difficulty

Medium"

###############################################################################
# Issue 12
###############################################################################

create_issue \
"Quality: Performance Review" \
"epic,frontend,backend,priority:low" \
"## Goal

Identify and address performance bottlenecks.

## Scope

- React rendering
- Database queries
- API response times
- Bundle size

## Acceptance Criteria

- [ ] Performance reviewed
- [ ] Improvements documented

## Learning Difficulty

Medium"

###############################################################################
# Issue 13
###############################################################################

create_issue \
"Quality: Final MVP QA Checklist" \
"epic,testing,priority:low" \
"## Goal

Verify that all MVP functionality works before release.

## Scope

- Authentication
- Conversations
- Messaging
- Real-time
- Presence
- Read receipts
- Pagination

## Acceptance Criteria

- [ ] All MVP features verified
- [ ] Critical bugs resolved
- [ ] Ready for first release

## Learning Difficulty

Low"

echo
echo "🎉 Production Readiness batch completed."