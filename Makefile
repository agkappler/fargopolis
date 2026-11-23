# The stacks' region is committed in infrastructure/cdk.json; export it so the aws CLI calls below
# (and anything else in a target) use it regardless of the machine's default region.
export AWS_REGION := $(shell node -p "require('./infrastructure/cdk.json').context.region")
export AWS_DEFAULT_REGION := $(AWS_REGION)

help:
	@echo "Targets:"
	@echo "  install        Install deps for web, infra, and the lambda venv"
	@echo "  lint           Lint the web app"
	@echo "  build          Build web app and infra (tsc)"
	@echo "  synth          cdk synth --all (infra correctness gate, no AWS creds needed)"
	@echo "  test           Run lambda tests (pytest via infra's npm script)"
	@echo "  dev            Run the web dev server"
	@echo "  ci             install + lint + build + synth + test (mirrors GitHub Actions)"
	@echo "  deploy-api          Deploy the prod API stack only (infra only)"
	@echo "  deploy-web          Deploy the prod frontend stack only (infra only)"
	@echo "  deploy-dev-api      Deploy the dev API stack only (infra only, -c tag=dev)"
	@echo "  deploy-dev-web      Deploy the dev frontend stack only (infra only, -c tag=dev)"
	@echo "  deploy-prod-content Build+sync+invalidate the prod frontend content (depends on install-web; no-op after first run)"
	@echo "  deploy-dev-content  Build+sync+invalidate the dev frontend content (depends on install-web; no-op after first run)"
	@echo "  deploy-dev     Deploy the dev stack pair AND build/sync/invalidate its frontend content (api, web, then content)"
	@echo "  deploy-prod    Deploy the default/prod stack pair AND build/sync/invalidate its frontend content (api, web, then content)"

.PHONY: help install install-web install-infra install-python \
        lint lint-web \
        build build-web build-infra \
        synth deploy-api deploy-web diff \
        deploy-dev-web deploy-dev-api deploy-dev deploy-prod \
        deploy-prod-content deploy-dev-content \
        test test-api \
        dev ci

install: install-web install-infra install-python

install-web:
	cd fargopolis-web && pnpm install

install-infra:
	cd infrastructure && npm ci

install-python:
	./scripts/setup-python-lambdas.sh

lint: lint-web

lint-web:
	cd fargopolis-web && pnpm run lint

build: build-web build-infra

build-web:
	cd fargopolis-web && pnpm run build

build-infra:
	cd infrastructure && npm run build

synth:
	cd infrastructure && npx cdk synth --all

deploy-api:
	cd infrastructure && npx cdk deploy FargopolisApi

deploy-web:
	cd infrastructure && npx cdk deploy FargopolisFrontend

# Dev deploys skip CDK's IAM-change approval prompt (dev is disposable and often run without a TTY);
# prod targets keep it, and prod normally deploys from CI.
deploy-dev-web:
	cd infrastructure && npx cdk deploy FargopolisFrontend-dev -c tag=dev --require-approval never

deploy-dev-api:
	cd infrastructure && npx cdk deploy FargopolisApi-dev -c tag=dev --require-approval never

deploy-prod-content: install-web
	api_url=$$(aws cloudformation describe-stacks --stack-name FargopolisApi --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" --output text) && \
	bucket=$$(aws cloudformation describe-stacks --stack-name FargopolisFrontend --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text) && \
	dist_id=$$(aws cloudformation describe-stacks --stack-name FargopolisFrontend --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text) && \
	cd fargopolis-web && VITE_API_URL="$$api_url" pnpm run build && cd .. && \
	aws s3 sync fargopolis-web/dist "s3://$$bucket" --delete && \
	aws cloudfront create-invalidation --distribution-id "$$dist_id" --paths "/*"

deploy-dev-content: install-web
	api_url=$$(aws cloudformation describe-stacks --stack-name FargopolisApi-dev --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" --output text) && \
	bucket=$$(aws cloudformation describe-stacks --stack-name FargopolisFrontend-dev --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text) && \
	dist_id=$$(aws cloudformation describe-stacks --stack-name FargopolisFrontend-dev --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text) && \
	cd fargopolis-web && VITE_API_URL="$$api_url" pnpm run build && cd .. && \
	aws s3 sync fargopolis-web/dist "s3://$$bucket" --delete && \
	aws cloudfront create-invalidation --distribution-id "$$dist_id" --paths "/*"

deploy-dev: deploy-dev-api deploy-dev-web deploy-dev-content

deploy-prod: deploy-api deploy-web deploy-prod-content

diff:
	cd infrastructure && npx cdk diff FargopolisApi

test: test-api

test-api:
	@test -x .venv/bin/python || { echo "Missing .venv — run 'make install' first"; exit 1; }
	cd infrastructure && npm run test

dev:
	cd fargopolis-web && pnpm run dev

ci: install lint build synth test
