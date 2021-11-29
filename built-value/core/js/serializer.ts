import {
  IGenericSerializableBuilder,
  ISerializableBuilder,
  ISerializer,
} from "../../contracts/serializers";
import { deserializeJsObject, serializeJsObject } from "./helper";
import { GenericTypeBuilder } from "../type-builder";
import { isDefined } from "../../../utils/types/type-utils";

export class UndecoratedSerializer implements ISerializer {
  /**
   * @inheritdoc
   */
  deserialize = <T>(bluePrint: new () => T, serializedObject: any): T =>
    deserializeJsObject<T>(bluePrint, serializedObject) as T;

  /**
   * @inheritdoc
   */
  serialize = <T>(bluePrint: new () => T, value: T) => serializeJsObject(value);
}

export class GenericUndecoratedSerializaleSerializer<T>
  extends GenericTypeBuilder<T>
  implements IGenericSerializableBuilder<T>
{
  serializer: ISerializer;

  constructor(serializer?: ISerializer) {
    super();
    this.serializer = serializer || new UndecoratedSerializer();
  }

  /**
   * @inheritdoc
   */
  fromSerialized(type: new () => T, serialized: any): T {
    if (!isDefined(serialized)) {
      return serialized;
    }
    return this.serializer.deserialize(type, serialized);
  }

  /**
   * @inheritdoc
   */
  toSerialized(value: T): { [prop: string]: any } {
    return this.serializer.serialize(value.constructor as new () => T, value);
  }
}

export class GenericSerializaleSerializer<T>
  extends GenericTypeBuilder<T>
  implements ISerializableBuilder<T>
{
  serializer: ISerializer;

  constructor(private type: new () => T, serializer?: ISerializer) {
    super();
    this.serializer = serializer || new UndecoratedSerializer();
  }

  /**
   * @inheritdoc
   */
  fromSerialized(serialized: object | string | any): T {
    return serialized
      ? this.serializer.deserialize(this.type, serialized)
      : serialized;
  }

  /**
   * @inheritdoc
   */
  toSerialized(value: T): { [prop: string]: any } {
    return this.serializer.serialize(value.constructor as new () => T, value);
  }
}
