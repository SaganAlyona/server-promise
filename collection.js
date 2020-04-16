import { promises as fs } from 'fs';
import { join } from 'path';
export class Collection {

  constructor(collectionName){
    this.filePath = join(process.cwd(), 'data', collectionName + '.json');
  }

  list(){
    return this._readData();
  }

  async findOne(query) {
    const items = await this._readData();
    return items.find(item => item.id === query.id);
  }

  async deleteId(id) {    
    const data = await this._readData();
    const filtered = data.filter(item => item.id !== id);
    return fs.writeFile(this.filePath, JSON.stringify(filtered, null, 2));
  }

  async _readData(){
    const fileData = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(fileData);
  }

  _writeData(data){
    return fs.writeFile(this.filePath, JSON.stringify(data, null, 2),'utf-8');
  }
    
  async updateOne(id, newDoc){
    const documents = await this._readData();
    const updatedHomeworks = documents.map(doc => (doc.id === id) ? newDoc : doc);
    return this._writeData(updatedHomeworks);
  }
}