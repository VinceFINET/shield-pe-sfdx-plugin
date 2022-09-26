import { SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('shield-pe-sfdx-plugin', 'fields');

class Field {
  public objectLabel:String;
  public fieldLabel:String;
  public fieldApiName:String;
  public fieldEncrypted:Boolean;
}

export default class Fields extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static args = [];

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<Array<Field>> {

    const conn = this.org.getConnection();
    const describeGlobalResult = await conn.describeGlobal();

    if (!describeGlobalResult.sobjects || describeGlobalResult.sobjects.length <= 0) {
      throw new SfError(messages.getMessage('errorNoResult'));
    }
    const numberObjects = describeGlobalResult.sobjects.length;
    this.ux.log('We found '+numberObjects+' objects');

    const output = new Array<Field>();

    this.ux.startSpinner('Parsing the objects...');
    for (var i=0; i<numberObjects; i++) {
      const currentObject = describeGlobalResult.sobjects[i];
      this.ux.setSpinnerStatus('Object '+i+'/'+numberObjects+' : '+currentObject.name);
      const describeResult = await conn.describe(describeGlobalResult.sobjects[i].name);
      for (var j=0; j<describeResult.fields.length; j++) {
        const currentField = describeResult.fields[j];
        const field = new Field();
        field.objectLabel = currentObject.label;
        field.fieldLabel = currentField.label;
        field.fieldApiName = currentObject.name+'.'+currentField.name;
        field.fieldEncrypted = currentField.encrypted;
        output.push(field);
      }
    }
    this.ux.stopSpinner(describeGlobalResult.sobjects.length + ' objects scanned!');

    return output;
  }
}
