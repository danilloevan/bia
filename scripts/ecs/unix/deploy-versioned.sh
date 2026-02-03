#!/bin/bash

# Configurações
ECR_REGISTRY="247402858139.dkr.ecr.us-east-1.amazonaws.com"
REPO_NAME="bia"
CLUSTER_NAME="cluster-bia"
SERVICE_NAME="service-bia"
TASK_DEF_FAMILY="task-def-bia"

# Captura commit hash ou usa parâmetro
if [ -n "$1" ]; then
    COMMIT_HASH="$1"
else
    COMMIT_HASH=$(git rev-parse --short=7 HEAD)
fi

echo "Deploying version: $COMMIT_HASH"

# Vai para raiz do projeto
cd /home/ec2-user/bia

# Build da imagem versionada
./scripts/ecs/unix/build-versioned.sh $COMMIT_HASH

# Captura task definition atual
CURRENT_TASK_DEF=$(aws ecs describe-task-definition --task-definition $TASK_DEF_FAMILY --query 'taskDefinition')

# Atualiza imagem na task definition
NEW_TASK_DEF=$(echo $CURRENT_TASK_DEF | jq --arg image "$ECR_REGISTRY/$REPO_NAME:$COMMIT_HASH" '.containerDefinitions[0].image = $image | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')

# Registra nova task definition
NEW_REVISION=$(aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF" --query 'taskDefinition.revision')

echo "New task definition registered: $TASK_DEF_FAMILY:$NEW_REVISION"

# Atualiza serviço
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_DEF_FAMILY:$NEW_REVISION

echo "Service updated with version: $COMMIT_HASH"
