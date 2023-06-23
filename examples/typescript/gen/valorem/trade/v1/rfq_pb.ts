// @generated by protoc-gen-es v1.2.1 with parameter "target=ts,import_extension=none"
// @generated from file rfq.proto (package quay, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { H128, H160, H256 } from "./types_pb";
import { ItemType, SignedOrder } from "./seaport_pb";

/**
 * * The Action enum specifies whether the taker is requesting a quote to buy or sell an asset. 
 *
 * @generated from enum quay.Action
 */
export enum Action {
  /**
   * @generated from enum value: BUY = 0;
   */
  BUY = 0,

  /**
   * @generated from enum value: SELL = 1;
   */
  SELL = 1,

  /**
   * @generated from enum value: INVALID = 255;
   */
  INVALID = 255,
}
// Retrieve enum metadata with: proto3.getEnumType(Action)
proto3.util.setEnumType(Action, "quay.Action", [
  { no: 0, name: "BUY" },
  { no: 1, name: "SELL" },
  { no: 255, name: "INVALID" },
]);

/**
 * * The fields comprising the quote request message give the maker what they need to provide a quote/signed offer. 
 *
 * @generated from message quay.QuoteRequest
 */
export class QuoteRequest extends Message<QuoteRequest> {
  /**
   * * The unique identifier for the quote request. This is used to match the
   * quote response to the quote request.
   *
   * Optional
   *
   * @generated from field: quay.H128 ulid = 1;
   */
  ulid?: H128;

  /**
   * * Ideally the maker would never know who the taker is, and vice-versa.
   * However, seaport reveals the makers' address to the taker.
   * takerAddress ensures there is no information asymmetry between
   * the maker and taker. Thought the trader may not always end up being
   * the taker.
   *
   * Optional
   *
   * @generated from field: quay.H160 taker_address = 2;
   */
  takerAddress?: H160;

  /**
   * @generated from field: quay.ItemType item_type = 3;
   */
  itemType = ItemType.NATIVE;

  /**
   * The token address for which a quote is being requested.
   *
   * Optional
   *
   * @generated from field: quay.H160 token_address = 4;
   */
  tokenAddress?: H160;

  /**
   * * The identifier_or_criteria represents either the ERC721 or ERC1155
   * token identifier or, in the case of a criteria-based item type, a
   * merkle root composed of the valid set of token identifiers for
   * the item. This value will be ignored for Ether and ERC20 item types,
   * and can optionally be zero for criteria-based item types to allow
   * for any identifier.
   *
   * Optional
   *
   * @generated from field: quay.H256 identifier_or_criteria = 5;
   */
  identifierOrCriteria?: H256;

  /**
   * @generated from field: quay.H256 amount = 6;
   */
  amount?: H256;

  /**
   * * A request by the Taker to the Maker, i.e. if the request is Buy the Taker wants to buy the option from the
   * Maker, whereas Sell is the Taker wanting to sell to the Maker.
   *
   * @generated from field: quay.Action action = 7;
   */
  action = Action.BUY;

  constructor(data?: PartialMessage<QuoteRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "quay.QuoteRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "ulid", kind: "message", T: H128 },
    { no: 2, name: "taker_address", kind: "message", T: H160 },
    { no: 3, name: "item_type", kind: "enum", T: proto3.getEnumType(ItemType) },
    { no: 4, name: "token_address", kind: "message", T: H160 },
    { no: 5, name: "identifier_or_criteria", kind: "message", T: H256 },
    { no: 6, name: "amount", kind: "message", T: H256 },
    { no: 7, name: "action", kind: "enum", T: proto3.getEnumType(Action) },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): QuoteRequest {
    return new QuoteRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): QuoteRequest {
    return new QuoteRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): QuoteRequest {
    return new QuoteRequest().fromJsonString(jsonString, options);
  }

  static equals(a: QuoteRequest | PlainMessage<QuoteRequest> | undefined, b: QuoteRequest | PlainMessage<QuoteRequest> | undefined): boolean {
    return proto3.util.equals(QuoteRequest, a, b);
  }
}

/**
 * The quote response message contains the quote/signed offer from the maker.
 *
 * @generated from message quay.QuoteResponse
 */
export class QuoteResponse extends Message<QuoteResponse> {
  /**
   * * The unique identifier for the quote request. This is used to match the
   * quote response to the quote request.
   *
   * Optional
   *
   * @generated from field: quay.H128 ulid = 1;
   */
  ulid?: H128;

  /**
   * * The address of the maker making the offer. 
   *
   * Optional
   *
   * @generated from field: quay.H160 maker_address = 2;
   */
  makerAddress?: H160;

  /**
   * * The order and signature from the maker. 
   *
   * @generated from field: quay.SignedOrder order = 3;
   */
  order?: SignedOrder;

  constructor(data?: PartialMessage<QuoteResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "quay.QuoteResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "ulid", kind: "message", T: H128 },
    { no: 2, name: "maker_address", kind: "message", T: H160 },
    { no: 3, name: "order", kind: "message", T: SignedOrder },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): QuoteResponse {
    return new QuoteResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): QuoteResponse {
    return new QuoteResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): QuoteResponse {
    return new QuoteResponse().fromJsonString(jsonString, options);
  }

  static equals(a: QuoteResponse | PlainMessage<QuoteResponse> | undefined, b: QuoteResponse | PlainMessage<QuoteResponse> | undefined): boolean {
    return proto3.util.equals(QuoteResponse, a, b);
  }
}

