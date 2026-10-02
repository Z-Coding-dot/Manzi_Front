import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const REVIEW_DECISIONS = ['approved', 'rejected', 'changes_requested'] as const;

export type PropertyReviewDecision = (typeof REVIEW_DECISIONS)[number];

export class ReviewPropertyDto {
  @IsIn(REVIEW_DECISIONS)
  status!: PropertyReviewDecision;
  @IsOptional() @IsString() @MaxLength(3000)
  notes?: string;
}
