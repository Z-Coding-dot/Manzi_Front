import { IsIn } from 'class-validator';

const REVIEW_DECISIONS = ['approved', 'rejected', 'changes_requested'] as const;

export type PropertyReviewDecision = (typeof REVIEW_DECISIONS)[number];

export class ReviewPropertyDto {
  @IsIn(REVIEW_DECISIONS)
  status!: PropertyReviewDecision;
}
