import type { Problem, ProblemTags } from '../types'

// Number of column carries when adding a + b by hand.
export function countCarries(a: number, b: number): number {
  let carries = 0
  let carry = 0
  while (a > 0 || b > 0) {
    const sum = (a % 10) + (b % 10) + carry
    carry = sum >= 10 ? 1 : 0
    carries += carry
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return carries
}

// Number of column borrows when computing a − b by hand (assumes a >= b).
export function countBorrows(a: number, b: number): number {
  let borrows = 0
  let borrow = 0
  while (a > 0 || b > 0) {
    const diff = (a % 10) - (b % 10) - borrow
    borrow = diff < 0 ? 1 : 0
    borrows += borrow
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return borrows
}

export const digitCount = (n: number) => String(Math.abs(n)).length

export function tagProblem(p: Problem): ProblemTags {
  const tags: ProblemTags = { answerDigits: digitCount(p.answer) }
  switch (p.op) {
    case 'add':
      tags.carries = countCarries(p.left, p.right)
      break
    case 'sub':
      tags.borrows = countBorrows(p.left, p.right)
      break
    case 'mul':
      // left came from the small range, right from the big range
      tags.small = p.left
      tags.big = p.right
      tags.bigAbove20 = p.right > 20
      break
    case 'div':
      // c ÷ a = b: the divisor is the small factor, the answer is the big one
      tags.small = p.right
      tags.big = p.answer
      tags.bigAbove20 = p.answer > 20
      tags.divAnswerAbove12 = p.answer > 12
      break
  }
  return tags
}
