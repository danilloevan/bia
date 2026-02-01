# Firebird to PostgreSQL Migration Skill

## Descrição
Skill para migração de dados de arquivos SQL exportados do Firebird para PostgreSQL, com mapeamento automático de tipos de dados e conversão de sintaxe.

## Funcionalidades

### ✅ Conversão de Tipos
- VARCHAR, CHAR, INTEGER, BIGINT
- DECIMAL, NUMERIC, FLOAT, DOUBLE PRECISION
- DATE, TIME, TIMESTAMP
- BLOB → BYTEA, BOOLEAN

### ✅ Conversão de Sintaxe
- Generators → Sequences
- AUTO_INCREMENT → SERIAL
- Comandos específicos do Firebird

### ✅ Operações Disponíveis
- **convert**: Converte arquivo SQL
- **migrate**: Converte e executa no PostgreSQL
- **test**: Testa conexão com PostgreSQL

## Uso

### Via Node.js
```javascript
const Migration = require('./.kiro/skills/firebird-to-postgres.js');

const migration = new Migration({
    pgHost: 'localhost',
    pgPort: 5432,
    pgUser: 'postgres',
    pgDatabase: 'bia_db'
});

// Converter arquivo
await migration.processSqlFile('dados.sql', 'dados_postgres.sql');

// Migração completa
await migration.migrate('dados.sql');
```

### Via CLI
```bash
# Converter arquivo
node .kiro/skills/firebird-to-postgres.js convert dados_firebird.sql dados_postgres.sql

# Migrar dados
node .kiro/skills/firebird-to-postgres.js migrate dados_firebird.sql

# Testar conexão
node .kiro/skills/firebird-to-postgres.js test
```

## Configuração

### Variáveis de Ambiente
```bash
export PG_HOST=localhost
export PG_PORT=5432
export PG_USER=postgres
export PG_PASSWORD=senha
export PG_DATABASE=bia_db
```

### Configuração no Código
```javascript
const config = {
    pgHost: 'localhost',
    pgPort: 5432,
    pgUser: 'postgres',
    pgPassword: 'senha',
    pgDatabase: 'bia_db',
    batchSize: 1000
};
```

## Exemplo de Uso no Projeto BIA

```bash
# 1. Converter arquivo exportado do Firebird
node .kiro/skills/firebird-to-postgres.js convert backup_firebird.sql backup_postgres.sql

# 2. Executar no PostgreSQL do Docker
docker compose exec server node .kiro/skills/firebird-to-postgres.js migrate backup_firebird.sql

# 3. Validar dados migrados
docker compose exec server psql -U postgres -d bia_db -c "SELECT COUNT(*) FROM tabela_migrada;"
```

## Troubleshooting

### Erro de Conexão
- Verificar se PostgreSQL está rodando
- Validar credenciais e host
- Testar com: `node .kiro/skills/firebird-to-postgres.js test`

### Erro de Conversão
- Verificar formato do arquivo SQL
- Logs detalhados mostram linha do erro
- Ajustar mapeamento de tipos se necessário
