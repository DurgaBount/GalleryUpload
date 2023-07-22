import Realm from 'realm';
import {createRealmContext} from '@realm/react';

export class TestRealm extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  name!: string;
  public url!: string;
  completed!: boolean;
  createdAt!: Date;
  static schema = {
    name: 'TestRealm',
    properties: {
      _id: 'objectId',
      name: 'string',
      url: 'string',
      completed: {type: 'bool', default: false},
      createdAt: 'date',
    },
  };
}

export const realmContext = createRealmContext({
  schema: [TestRealm],
});
