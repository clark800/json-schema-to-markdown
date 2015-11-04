/* eslint no-use-before-define: [2, "nofunc"] */
'use strict';
const fs = require('fs');

// rows are represented as an array of three strings: name, type, description
// TODO: make a table of objects like "address" and "amount" that link
// to separate sections rather than getting expanded

function formatTable(rows) {
  const header = ['Name', 'Type', 'Description'];
  const divider = ['----', '----', '-----------'];
  const allRows = [header, divider].concat(rows);
  return allRows.map(row => row.join(' | ')).join('\n');
}

function formatName(path) {
  if (path.length <= 1) {
    return path;
  }
  return '*' + path.slice(0, -1).join('.') + '.* ' + path.slice(-1)[0];
}

function formatType(schema) {
  return schema.type || schema.$ref || 'object';
}

function formatRow(schema, path) {
  return [formatName(path), formatType(schema), schema.description];
}

function flatten(arrays) {
  return [].concat.apply([], arrays);
}

function generateRowsForObject(schema, path) {
  const rows = flatten(Object.keys(schema.properties).sort().map(name =>
    generateRowsForSchema(schema.properties[name], path.concat([name]))));
  return path.length > 0 ? [formatRow(schema, path)].concat(rows) : rows;
}

function generateRowsForArray(schema, path) {
  const firstRow = formatRow(schema, path);
  if (!schema.items.properties) {
    return [firstRow];
  }
  const newPath = path.slice(0, -1).concat([path.slice(-1)[0] + '[]']);
  return [firstRow].concat(generateRowsForSchema(schema.items, newPath));
}

function generateRowsForSchema(schema, path) {
  if (schema.type === 'array') {
    if (path.length > 0) {
      return generateRowsForArray(schema, path);
    }
    return generateRowsForObject(schema.items, path);
  }
  if (schema.type === 'object' || schema.properties) {
    return generateRowsForObject(schema, path);
  }
  return [formatRow(schema, path)];
}

function main() {
  const filepath = process.argv[2];
  const schemaJSON = fs.readFileSync(filepath);
  const schema = JSON.parse(schemaJSON);
  console.log(formatTable(generateRowsForSchema(schema, [])));
}

main();
