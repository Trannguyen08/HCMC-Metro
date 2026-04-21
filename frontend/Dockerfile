FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN if [ -f package-lock.json ]; then npm install; \
    elif [ -f yarn.lock ]; then yarn install; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
    else npm install; \
    fi

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

