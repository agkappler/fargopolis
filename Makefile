help:
	@echo "Targets:"
	@echo "  install        Install deps for web, infra, and the lambda venv"
	@echo "  lint           Lint the web app"
	@echo "  build          Build web app and infra (tsc)"
	@echo "  synth          cdk synth --all (infra correctness gate, no AWS creds needed)"
	@echo "  test           Run lambda tests (pytest via infra's npm script)"
	@echo "  dev            Run the web dev server"
	@echo "  ci             install + lint + build + synth + test (mirrors GitHub Actions)"

.PHONY: help install install-web install-infra install-python \
        lint lint-web \
        build build-web build-infra \
        synth deploy-api deploy-web diff \
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

diff:
	cd infrastructure && npx cdk diff FargopolisApi

test: test-api

test-api:
	@test -x .venv/bin/python || { echo "Missing .venv — run 'make install' first"; exit 1; }
	cd infrastructure && npm run test

dev:
	cd fargopolis-web && pnpm run dev

ci: install lint build synth test
