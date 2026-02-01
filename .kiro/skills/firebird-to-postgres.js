#!/usr/bin/env node

/**
 * Skill: Firebird to PostgreSQL Migration
 * Mapeia e migra dados de arquivos SQL exportados do Firebird para PostgreSQL
 */

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

class FirebirdToPostgresMigration {
    constructor(config = {}) {
        this.config = {
            pgHost: config.pgHost || 'localhost',
            pgPort: config.pgPort || 5432,
            pgUser: config.pgUser || 'postgres',
            pgPassword: config.pgPassword || '',
            pgDatabase: config.pgDatabase || 'bia_db',
            batchSize: config.batchSize || 1000,
            ...config
        };
        
        this.typeMapping = {
            'VARCHAR': 'VARCHAR',
            'CHAR': 'CHAR',
            'INTEGER': 'INTEGER',
            'BIGINT': 'BIGINT',
            'DECIMAL': 'DECIMAL',
            'NUMERIC': 'NUMERIC',
            'FLOAT': 'REAL',
            'DOUBLE PRECISION': 'DOUBLE PRECISION',
            'DATE': 'DATE',
            'TIME': 'TIME',
            'TIMESTAMP': 'TIMESTAMP',
            'BLOB': 'BYTEA',
            'BOOLEAN': 'BOOLEAN'
        };
    }

    /**
     * Processa arquivo SQL do Firebird e converte para PostgreSQL
     */
    async processSqlFile(inputFile, outputFile = null) {
        try {
            const sqlContent = fs.readFileSync(inputFile, 'utf8');
            const convertedSql = this.convertFirebirdToPostgres(sqlContent);
            
            if (outputFile) {
                fs.writeFileSync(outputFile, convertedSql);
                console.log(`✅ Arquivo convertido salvo em: ${outputFile}`);
            }
            
            return convertedSql;
        } catch (error) {
            console.error('❌ Erro ao processar arquivo:', error.message);
            throw error;
        }
    }

    /**
     * Converte sintaxe Firebird para PostgreSQL
     */
    convertFirebirdToPostgres(sqlContent) {
        let converted = sqlContent;
        
        // Remove comandos específicos do Firebird
        converted = converted.replace(/SET TERM.*?;/gi, '');
        converted = converted.replace(/COMMIT WORK;/gi, 'COMMIT;');
        
        // Converte tipos de dados
        Object.entries(this.typeMapping).forEach(([fbType, pgType]) => {
            const regex = new RegExp(`\\b${fbType}\\b`, 'gi');
            converted = converted.replace(regex, pgType);
        });
        
        // Converte sequências/generators
        converted = converted.replace(/CREATE GENERATOR\s+(\w+);/gi, 'CREATE SEQUENCE $1;');
        converted = converted.replace(/SET GENERATOR\s+(\w+)\s+TO\s+(\d+);/gi, 'ALTER SEQUENCE $1 RESTART WITH $2;');
        
        // Converte AUTO_INCREMENT para SERIAL
        converted = converted.replace(/INTEGER\s+NOT\s+NULL\s+PRIMARY\s+KEY/gi, 'SERIAL PRIMARY KEY');
        
        return converted;
    }

    /**
     * Executa comandos SQL no PostgreSQL
     */
    async executeSql(sql, database = null) {
        const db = database || this.config.pgDatabase;
        const connectionString = `postgresql://${this.config.pgUser}:${this.config.pgPassword}@${this.config.pgHost}:${this.config.pgPort}/${db}`;
        
        return new Promise((resolve, reject) => {
            const command = `psql "${connectionString}" -c "${sql.replace(/"/g, '\\"')}"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Erro SQL: ${error.message}\nStderr: ${stderr}`));
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    /**
     * Executa arquivo SQL no PostgreSQL
     */
    async executeSqlFile(filePath, database = null) {
        const db = database || this.config.pgDatabase;
        const connectionString = `postgresql://${this.config.pgUser}:${this.config.pgPassword}@${this.config.pgHost}:${this.config.pgPort}/${db}`;
        
        return new Promise((resolve, reject) => {
            const command = `psql "${connectionString}" -f "${filePath}"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Erro ao executar arquivo: ${error.message}\nStderr: ${stderr}`));
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    /**
     * Migração completa: converte e executa
     */
    async migrate(inputFile, options = {}) {
        try {
            console.log('🚀 Iniciando migração Firebird → PostgreSQL');
            
            // Processa arquivo
            const outputFile = options.outputFile || inputFile.replace('.sql', '_postgres.sql');
            await this.processSqlFile(inputFile, outputFile);
            
            // Executa no PostgreSQL se solicitado
            if (options.execute !== false) {
                console.log('📊 Executando SQL no PostgreSQL...');
                const result = await this.executeSqlFile(outputFile);
                console.log('✅ Migração concluída com sucesso!');
                return result;
            }
            
            console.log('✅ Conversão concluída. Execute manualmente se necessário.');
            return { outputFile };
            
        } catch (error) {
            console.error('❌ Erro na migração:', error.message);
            throw error;
        }
    }

    /**
     * Valida conectividade com PostgreSQL
     */
    async testConnection() {
        try {
            const result = await this.executeSql('SELECT version();');
            console.log('✅ Conexão PostgreSQL OK');
            return result;
        } catch (error) {
            console.error('❌ Erro de conexão PostgreSQL:', error.message);
            throw error;
        }
    }
}

// Exporta a classe para uso
module.exports = FirebirdToPostgresMigration;

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Uso: node firebird-to-postgres.js <comando> [opções]

Comandos:
  convert <input.sql> [output.sql]  - Converte arquivo Firebird para PostgreSQL
  migrate <input.sql>               - Converte e executa no PostgreSQL
  test                              - Testa conexão PostgreSQL

Exemplo:
  node firebird-to-postgres.js convert dados_firebird.sql dados_postgres.sql
  node firebird-to-postgres.js migrate dados_firebird.sql
        `);
        process.exit(1);
    }

    const migration = new FirebirdToPostgresMigration();
    const command = args[0];

    switch (command) {
        case 'convert':
            if (args[1]) {
                migration.processSqlFile(args[1], args[2])
                    .then(() => console.log('✅ Conversão concluída'))
                    .catch(err => console.error('❌ Erro:', err.message));
            } else {
                console.error('❌ Arquivo de entrada necessário');
            }
            break;
            
        case 'migrate':
            if (args[1]) {
                migration.migrate(args[1])
                    .then(() => console.log('✅ Migração concluída'))
                    .catch(err => console.error('❌ Erro:', err.message));
            } else {
                console.error('❌ Arquivo de entrada necessário');
            }
            break;
            
        case 'test':
            migration.testConnection()
                .then(() => console.log('✅ Teste de conexão OK'))
                .catch(err => console.error('❌ Erro de conexão:', err.message));
            break;
            
        default:
            console.error('❌ Comando inválido:', command);
    }
}
