import { JsonProperty, ObjectSerializer } from 'src/app/lib/domain/built-value/core/serializers';
import { ISerializableBuilder } from 'src/app/lib/domain/built-value/contracts/serializers';
import { TypeBuilder } from 'src/app/lib/domain/built-value/contracts/type';
import { GenericSerializaleSerializer } from 'src/app/lib/domain/built-value/core/js/serializer';

export class FormControlOptionsEntity {
  @JsonProperty('id')
  id: number = undefined;
  @JsonProperty('table')
  table: string = undefined;
  @JsonProperty('keyfield')
  keyfield: string = undefined;
  @JsonProperty('groupfield')
  groupfield: string = undefined;
  @JsonProperty('valuefield')
  description: string = undefined;
  @JsonProperty('display_label')
  displayLabel: string = undefined;

  /**
   * @description Calls to get the builder provider of the current class|type
   */
  static builder(): TypeBuilder<FormControlOptionsEntity> | ISerializableBuilder<FormControlOptionsEntity> {
    return new GenericSerializaleSerializer(FormControlOptionsEntity, new ObjectSerializer());
  }
}
