FROM node:16 AS BUILD

WORKDIR /app

COPY ./client .

RUN yarn install --frozen-lockfile && yarn build

FROM node:16 AS FINAL

WORKDIR /app

# Copy over files that we need to run from build
# and for views/public/etc
COPY ./client ./

RUN yarn install --production=true

COPY --from=BUILD /app/dist/ /app/dist/
ENV PORT=5000

EXPOSE 5000

CMD ["yarn", "start"]