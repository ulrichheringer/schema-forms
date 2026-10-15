# schema-forms

Renderizador local de formulários a partir de JSON Schema. Valida required, tipos, enums, limites, padrões, e-mail, URL e arrays simples; exibe os dados validados e permite exportar JSON.

## Executar

Requer Node.js 20.19 ou superior. Rode **npm install** e **npm run dev**; edite ou substitua o exemplo de schema e selecione **Renderizar**. Preencha o formulário para validar e exportar. **npm test** verifica parsing e validação, e **npm run build** gera dist/.

Suporta propriedades string, number, integer, boolean, array de valores simples e object aninhado. Referências externas e outras palavras-chave do padrão não são implementadas.
