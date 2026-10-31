-- Keep each symmetric friendship in one canonical order and reject self friendships.
ALTER TABLE "Friendship"
ADD CONSTRAINT "Friendship_canonical_user_order"
CHECK ("userOneId" < "userTwoId");
