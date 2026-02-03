cd /home/ec2-user/bia
./build.sh
aws ecs update-service --cluster cluster-bia --service service-bia --force-new-deployment
