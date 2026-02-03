#!/bin/bash

# Configurações
ECR_REGISTRY="247402858139.dkr.ecr.us-east-1.amazonaws.com"
REPO_NAME="bia"

# Captura commit hash (7 caracteres) ou usa parâmetro
if [ -n "$1" ]; then
    COMMIT_HASH="$1"
else
    COMMIT_HASH=$(git rev-parse --short=7 HEAD)
fi

echo "Building version: $COMMIT_HASH"

# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build da imagem
docker build -t $REPO_NAME:$COMMIT_HASH .

# Tag para ECR
docker tag $REPO_NAME:$COMMIT_HASH $ECR_REGISTRY/$REPO_NAME:$COMMIT_HASH

# Push para ECR
docker push $ECR_REGISTRY/$REPO_NAME:$COMMIT_HASH

echo "Image pushed: $ECR_REGISTRY/$REPO_NAME:$COMMIT_HASH"
