import boto3
import requests
from .aws import key, secret_key
s3 = boto3.client('s3',
                       aws_access_key_id=key,
                       aws_secret_access_key=secret_key)

bucket = 'khusb-sample'

def get_upload_url(user, path):
    url = s3.generate_presigned_url(
        ClientMethod='put_object',
        Params={
            'Bucket': bucket,
            'Key': user+path,
        }
    )
    return url

def get_download_url(user, path):
    url = s3.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket,
            'Key': user+path,
        }
    )
    return url

def delete_object(user, path):
    objects_to_delete = s3.list_objects(Bucket=bucket, Prefix=user+path)

    delete_keys = {'Objects': []}
    delete_keys['Objects'] = [{'Key': k} for k in [obj['Key'] for obj in objects_to_delete.get('Contents', [])]]

    s3.delete_objects(Bucket=bucket, Delete=delete_keys)