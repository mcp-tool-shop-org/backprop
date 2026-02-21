FROM node:22-slim

# Install Python and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r backprop && useradd -r -g backprop -m -d /home/backprop backprop

# Set up working directory
WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm build

# Link the CLI globally
RUN npm link

# Setup volume for experiments
RUN mkdir -p /home/backprop/.backprop && chown -R backprop:backprop /home/backprop/.backprop
VOLUME /home/backprop/.backprop

USER backprop

# Set the entrypoint
ENTRYPOINT ["backprop"]
CMD ["--help"]
