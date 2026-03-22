# Derive Operator — Complete Flow Analysis

> **Purpose:** Comprehensive analysis of the `derive` ETL operator in the Kol Sherut pipeline.
> This document explains how the `dataflows` framework works and walks through every stage
> of the derive operator, documenting each processing step, checkpoint, and data transformation.
>
> **Reading guide:** Start with [How dataflows Works](#how-dataflows-works) if you're unfamiliar
> with the framework, then read each stage sequentially. The [Checkpoint & Cache Map](#checkpoint--cache-map)
> at the end provides a quick-reference table of all persistence points.

## Table of Contents

- [How dataflows Works](#how-dataflows-works)
  - [Flow() and Processor Chaining](#flow-and-processor-chaining)
  - [Lazy Evaluation and Pull-Based Execution](#lazy-evaluation-and-pull-based-execution)
  - [Function Auto-Detection](#function-auto-detection)
  - [checkpoint vs dump_to_path](#checkpoint-vs-dump_to_path)
  - [Other Key Processors](#other-key-processors)
- [Derive Overview](#derive-overview)
  - [Entry Point and Orchestration](#entry-point-and-orchestration)
  - [High-Level Pipeline Diagram](#high-level-pipeline-diagram)
- [Stage 1: from_curation — Data Import](#stage-1-from_curation--data-import)
- [Stage 2: to_dp — Core Data Transformation](#stage-2-to_dp--core-data-transformation)
  - [Sub-flow 1: srm_data_pull](#sub-flow-1-srm_data_pull)
  - [Sub-flow 2: flat_branches](#sub-flow-2-flat_branches)
  - [Sub-flow 3: flat_services](#sub-flow-3-flat_services)
  - [Sub-flow 4: flat_table](#sub-flow-4-flat_table)
  - [Sub-flow 5: card_data](#sub-flow-5-card_data)
  - [RSScoreCalc — Side-Channel Flow](#rsscorecalc--side-channel-flow)
- [Stage 3: autocomplete — Autocomplete Generation](#stage-3-autocomplete--autocomplete-generation)
- [Stage 4: to_es — Elasticsearch Loading](#stage-4-to_es--elasticsearch-loading)
- [Stage 5: to_sql — Airtable Card Upload](#stage-5-to_sql--airtable-card-upload)
- [Helper Modules](#helper-modules)
  - [helpers.py — Shared Preprocessing Flows](#helperspy--shared-preprocessing-flows)
  - [autotagging.py — Auto-tagging Rules](#autotaggingpy--auto-tagging-rules)
  - [es_schemas.py — ES Field Schema Constants](#es_schemaspy--es-field-schema-constants)
  - [es_utils.py — ES Connection and Loading](#es_utilspy--es-connection-and-loading)
  - [manual_fixes.py — Manual Fix Application](#manual_fixespy--manual-fix-application)
- [Checkpoint & Cache Map](#checkpoint--cache-map)
- [External Dependencies Reference](#external-dependencies-reference)

---

## How dataflows Works

<!-- TODO: Fill in Plan 02 -->

### Flow() and Processor Chaining

<!-- TODO: Fill in Plan 02 -->

### Lazy Evaluation and Pull-Based Execution

<!-- TODO: Fill in Plan 02 -->

### Function Auto-Detection

<!-- TODO: Fill in Plan 02 -->

### checkpoint vs dump_to_path

<!-- TODO: Fill in Plan 02 -->

### Other Key Processors

<!-- TODO: Fill in Plan 02 -->

---

## Derive Overview

<!-- TODO: Fill in Plan 03 -->

### Entry Point and Orchestration

<!-- TODO: Fill in Plan 03 -->

### High-Level Pipeline Diagram

<!-- TODO: Fill in Plan 05 -->

---

## Stage 1: from_curation — Data Import

<!-- TODO: Fill in Plan 03 -->

---

## Stage 2: to_dp — Core Data Transformation

<!-- TODO: Fill in Plan 03 -->

### Sub-flow 1: srm_data_pull

<!-- TODO: Fill in Plan 03 -->

### Sub-flow 2: flat_branches

<!-- TODO: Fill in Plan 03 -->

### Sub-flow 3: flat_services

<!-- TODO: Fill in Plan 03 -->

### Sub-flow 4: flat_table

<!-- TODO: Fill in Plan 03 -->

### Sub-flow 5: card_data

<!-- TODO: Fill in Plan 03 -->

### RSScoreCalc — Side-Channel Flow

<!-- TODO: Fill in Plan 03 -->

---

## Stage 3: autocomplete — Autocomplete Generation

<!-- TODO: Fill in Plan 03 -->

---

## Stage 4: to_es — Elasticsearch Loading

<!-- TODO: Fill in Plan 04 -->

---

## Stage 5: to_sql — Airtable Card Upload

<!-- TODO: Fill in Plan 04 -->

---

## Helper Modules

### helpers.py — Shared Preprocessing Flows

<!-- TODO: Fill in Plan 04 -->

### autotagging.py — Auto-tagging Rules

<!-- TODO: Fill in Plan 04 -->

### es_schemas.py — ES Field Schema Constants

<!-- TODO: Fill in Plan 04 -->

### es_utils.py — ES Connection and Loading

<!-- TODO: Fill in Plan 04 -->

### manual_fixes.py — Manual Fix Application

<!-- TODO: Fill in Plan 04 -->

---

## Checkpoint & Cache Map

<!-- TODO: Fill in Plan 05 -->

---

## External Dependencies Reference

<!-- TODO: Fill in Plan 04 -->
