#!/bin/bash

# Configurações
CLUSTER_NAME="cluster-bia"
SERVICE_NAME="service-bia"
TASK_DEF_FAMILY="task-def-bia"

echo "Available task definition revisions:"
aws ecs list-task-definitions --family-prefix $TASK_DEF_FAMILY --query 'taskDefinitionArns[]' --output table

if [ -n "$1" ]; then
    REVISION="$1"
    echo "Rolling back to revision: $REVISION"
    
    # Atualiza serviço para revisão específica
    aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_DEF_FAMILY:$REVISION
    
    echo "Rollback completed to $TASK_DEF_FAMILY:$REVISION"
else
    echo "Usage: $0 <revision_number>"
    echo "Example: $0 1"
fi
