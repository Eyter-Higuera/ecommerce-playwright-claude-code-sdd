import { randomBytes } from 'node:crypto';
import { TEST_DATA_PREFIX, uniqueValue } from './test-data-factory';

// Spec 004 test customers (plan D-1, D-2). Every customer is registered for one test, with TEST_
// names and a unique TEST_ email (verified 2026-10-09: the shop keeps the upper case, and the login
// must use the email exactly as registered). The password is generated here and must never be
// logged, attached or written anywhere.

/** Domain reserved for examples (RFC 2606): never a real mailbox. */
const TEST_EMAIL_DOMAIN = 'example.test';
/** Random bytes in the password (24 hex characters). */
const PASSWORD_RANDOM_BYTES = 12;
/** Upper case, digit and symbol appended so any password policy is met. */
const PASSWORD_SUFFIX = 'A1!';
/** A placeholder mobile number: ten zeros, never a real phone. */
const TEST_MOBILE = '0000000000';

/** The registration body the shop expects (observed 2026-10-09). */
export interface CustomerRegistration {
  firstName: string;
  lastName: string;
  userEmail: string;
  userRole: string;
  occupation: string;
  gender: string;
  userMobile: string;
  userPassword: string;
  confirmPassword: string;
  required: boolean;
}

/** A new TEST_ customer for one test; `workerIndex` keeps parallel workers apart. */
export function buildTestCustomer(workerIndex: number): CustomerRegistration {
  const password = `${TEST_DATA_PREFIX}${randomBytes(PASSWORD_RANDOM_BYTES).toString('hex')}${PASSWORD_SUFFIX}`;
  return {
    firstName: `${TEST_DATA_PREFIX}First`,
    lastName: `${TEST_DATA_PREFIX}Last`,
    userEmail: `${uniqueValue('cart', workerIndex)}@${TEST_EMAIL_DOMAIN}`,
    userRole: 'customer',
    occupation: 'Student',
    gender: 'Male',
    userMobile: TEST_MOBILE,
    userPassword: password,
    confirmPassword: password,
    required: true,
  };
}
