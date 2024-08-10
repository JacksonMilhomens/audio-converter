# Define a imagem base
FROM node:18

# Instala o ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia o arquivo package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos para o diretório de trabalho
COPY . .

# Expõe a porta em que o servidor está ouvindo
EXPOSE 3080

# Define o comando para iniciar o aplicativo
CMD ["node", "server.js"]
