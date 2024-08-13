import { Match } from "meteor/check";


export const ExposeDefaults = {
  method: true,
  unblock: true,
};

export const ExposeSchema = {
  firewall: Match.Maybe(
    Match.OneOf(Function, [Function]),
  ),
  unblock: Match.Maybe(Boolean),
  method: Match.Maybe(Boolean),
  embody: Match.Maybe(
    Match.OneOf(Object, Function),
  ),
  schema: Match.Maybe(Match.Any),
  validateParams: Match.Maybe(
    Match.OneOf(Object, Function),
  ),
  rateLimit: Match.Maybe(Object),
  cache: Match.Maybe(Object),
};
