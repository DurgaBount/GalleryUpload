import Realm from 'realm';
import {createRealmContext} from '@realm/react';

export class TestRealm extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  name!: string;
  public url!: string;
  completed!: boolean;
  createdAt!: Date;
  isOnline!: boolean;
  isDeleted!: boolean;
  progress!: number;

  static schema = {
    name: 'TestRealm',
    properties: {
      _id: 'objectId',
      name: 'string',
      url: 'string',
      completed: {type: 'bool', default: false},
      createdAt: 'date',
      isOnline: {type: 'bool', default: false},
      isDeleted: {type: 'bool', default: false},
      progress: 'float',
    },
    primaryKey: '_id', // Set the primary key for the collection
  };
}

export const realmContext = createRealmContext({
  schema: [TestRealm],
});
