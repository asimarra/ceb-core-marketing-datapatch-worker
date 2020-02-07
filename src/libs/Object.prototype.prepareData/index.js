/**
 * @type { Function }
 * @returns { Array } [Colums, Values]
 * 
 * @example
 * {
 *  id_owner:1,
 *  cd_account_type: 'BAS'
 * } 
 * 
 * { Returns } 
 * [ 
 *  [id_owner, cd_account_type],
 *  [1, 'BAS']
 * ]
 */
if (!Object.prototype.prepareData) {
  Object.prototype.prepareData = function() {
    const $this = this;
    const columns = Object.keys($this);
    const values = columns.map(column => {
      let value = "NULL";

      switch (typeof $this[column]) {
        case 'boolean':
          value = $this[column];
          break;
        case 'number':
          value = $this[column];
          break;
        case 'string':
          value = $this[column] === "" ? "NULL" : `"${$this[column].replace(`\\`, ``)}"`;
          break;
        case 'object':
          value = $this[column] === null ? "NULL" : $this[column];
          break;
        default:
          value = "NULL";
          break;
      }

      return value;
    });
    return [columns, values];
  };
}
