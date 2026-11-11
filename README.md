# Presença Interseccional na Unicamp
### Uma análise feminista de dados sobre gênero, raça/cor e deficiência na universidade

**Autoras:** Larissa Kilian Pacheco, Luppi Campos e Maiara Araujo Damião.

O trabalho integra a disciplina MMO810 – Feminismo de Dados.

---

## Sobre o projeto

Este projeto investiga como a presença feminina na Universidade Estadual de Campinas (Unicamp) se modificou ao longo dos últimos anos, considerando as dimensões de gênero, raça/cor e deficiência entre discentes e docentes.

A pesquisa adota uma perspectiva feminista interseccional, buscando compreender como diferentes marcadores sociais se relacionam com a ocupação dos espaços universitários, além de identificar quais grupos são representados, sub-representados ou invisibilizados nas estatísticas institucionais.

Como fonte primária, utilizamos os **Anuários Estatísticos da Unicamp**, elaborados pela Assessoria de Economia e Planejamento (AEPLAN). A análise também se fundamenta nos princípios apresentados em *Data Feminism*, de Catherine D'Ignazio e Lauren F. Klein (2020), que propõem uma abordagem crítica sobre a produção, organização e interpretação de dados.

## Fontes de dados

A principal fonte utilizada são os **Anuários Estatísticos da Unicamp**, disponibilizados pela AEPLAN.

Os arquivos PDF utilizados na pesquisa estão disponíveis na pasta `anuarios/`.

**Fonte:** [Anuários Estatísticos da Unicamp](https://www.aeplan.unicamp.br/anuario.php).

## Visualização dos resultados

### Página web interativa

O projeto também conta com uma página web desenvolvida para apresentar os resultados da pesquisa de maneira acessível e interativa.

**Acesse:** [Presença Interseccional na Unicamp](https://maiaraujo.com.br/anuario)

## Estrutura do repositório

```text
MMO810-Feminismo-de-Dados/
│
├── anuarios/
│   ├── anuario_2005.pdf
│   ├── anuario_2006.pdf
│   ├── ...
│   ├── anuario_2025.pdf
│   └── Anuario_2026.pdf
│
├── site-anuario/
│   └── Arquivos da página web
│
├── Dados dos Relatórios - Preencher.xlsx
│
└── Gerando_Diagramas_Graficos.ipynb
```

### Descrição dos arquivos

- **`anuarios/`**: documentos PDF dos Anuários Estatísticos da Unicamp utilizados como fonte primária.
- **`Dados dos Relatórios - Preencher.xlsx`**: planilha de consolidação dos dados coletados para a pesquisa.
- **`Gerando_Diagramas_Graficos.ipynb`**: notebook Python responsável pelo processamento dos dados e geração das visualizações.
- **`site-anuario/`**: arquivos HTML, CSS, JavaScript, JSON e demais recursos utilizados na página web.