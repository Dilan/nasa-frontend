VERSION ?= 1.0

build:	
	docker build -t ghcr.io/dilan/nasa-site:$(VERSION) .

run:
	docker run -p 4200:4200 -d --name nasa-site ghcr.io/dilan/nasa-site:$(VERSION)

build-and-push:	
	docker buildx build --platform linux/amd64 -t ghcr.io/dilan/nasa-site:$(VERSION) --push .

pull:
	docker pull ghcr.io/dilan/nasa-site:$(VERSION)
