# Helper

## Goal

The goal of Helper is to ensure that I am able to be the Hands and Feet of God
and to help others do the same.

## Demos

<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.loom.com/embed/94a3ec20436f4f86a5fb88785f523eb1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

## Screenshots/

![Dashboard](./artifacts/Screenshot%20from%202022-08-24%2018.12.24.png)

![Create Help Item](./artifacts/Screenshot%20from%202022-08-24%2018.13.02.png)

![View Help Item](./artifacts/Screenshot%20from%202022-08-24%2018.12.50.png)

## Development

We have split the Client and the API. The Client is responsible for serving the
Server-Side rendered Markup, along with handling any HTTP requests that the Browser
makes, such as Form Submitions (_Functions_) or dynamic pages (_Pages_). The API
is responsible for understanding and serving the Data Layer (_PSQL_) and for handling
any authorization needed.

#### Install Dependencies

```sh
cd client && yarn
cd ../
cd api && yarn
cd ../
```

#### Start Backing Services

```sh
docker-compose -f docker-compose.dev.yaml up -d
```

#### Connect to Local PSQL Instance

```sh
# Get the container ID
docker ps

# Enter the container
docker exec -it <container-id> bash

# run psql to connect using username and database name
psql -U username helper
```

#### Start Services

```sh
# In one terminal
cd client && yarn dev

# In another terminal
cd api && yarn dev
```
