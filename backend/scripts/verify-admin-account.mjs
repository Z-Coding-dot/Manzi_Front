import 'reflect-metadata';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../dist/users/users.service.js';
import { AdminService } from '../dist/admin/admin.service.js';
import { AuthService } from '../dist/auth/auth.service.js';
import { JwtStrategy } from '../dist/auth/strategies/jwt.strategy.js';

if (process.env.NODE_ENV === 'production')
  throw new Error('Run account verification against a development database.');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const rollback = new Error('ROLLBACK_VERIFICATION');
try {
  await prisma.$transaction(
    async (tx) => {
      const account = await tx.user.create({
        data: {
          name: 'Account verification',
          email: `qa-${randomUUID()}@example.invalid`,
          role: 'customer',
          passwordHash: await bcrypt.hash('old-test-password', 4),
        },
      });
      const actor = await tx.user.create({
        data: {
          name: 'Role verification',
          email: `qa-${randomUUID()}@example.invalid`,
          role: 'admin',
          passwordHash: await bcrypt.hash('actor-test-password', 4),
        },
      });
      // Service transactions share the outer transaction; every test record is rolled back.
      const wrapped = new Proxy(tx, {
        get(target, key) {
          return key === '$transaction'
            ? (fn) => fn(tx)
            : Reflect.get(target, key);
        },
      });
      const users = new UsersService(wrapped);
      const admin = new AdminService(wrapped);
      const auth = new AuthService(
        wrapped,
        new JwtService(),
        new ConfigService(),
      );
      const strategy = new JwtStrategy(new ConfigService(), wrapped);
      await admin.updateUser(
        account.id,
        { role: 'support_agent' },
        { sub: actor.id, role: 'admin', email: null },
      );
      assert.equal((await users.findMe(account.id)).role, 'support_agent');
      await users.updatePreferences(account.id, {
        language: 'fa_AF',
        currency: 'USD',
        density: 'compact',
        dateFormat: 'iso',
        timeZone: 'UTC',
        refreshInterval: 0,
        reducedMotion: true,
      });
      const profile = await users.findMe(account.id);
      assert.equal(profile.language, 'fa_AF');
      assert.equal(profile.consolePreferences.refreshInterval, 0);
      const avatar =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=';
      await users.updateAvatar(account.id, avatar);
      assert.equal((await users.findMe(account.id)).avatar, avatar);
      const login = await auth.login(
        { email: account.email, password: 'old-test-password' },
        {},
      );
      assert.equal(login.user.avatar, avatar);
      const jwt = new JwtService();
      const oldPayload = jwt.decode(login.accessToken);
      assert.equal(oldPayload.ver, 0);
      await users.updatePassword(account.id, {
        currentPassword: 'old-test-password',
        newPassword: 'new-test-password',
      });
      await assert.rejects(() => strategy.validate(oldPayload));
      assert.equal(
        await tx.refreshToken.count({
          where: { userId: account.id, revokedAt: null },
        }),
        0,
      );
      await assert.rejects(() => auth.refresh(login.refreshToken));
      await assert.rejects(() =>
        auth.login({ email: account.email, password: 'old-test-password' }, {}),
      );
      const nextLogin = await auth.login(
        { email: account.email, password: 'new-test-password' },
        {},
      );
      assert.equal(jwt.decode(nextLogin.accessToken).ver, 1);
      await users.updateAvatar(account.id, null);
      assert.equal((await users.findMe(account.id)).avatar, null);
      throw rollback;
    },
    { timeout: 20000 },
  );
} catch (error) {
  if (error === rollback)
    console.log(
      'Account database checks passed: role assignment, preferences, avatar, password, revoked sessions and new sign-in. Test accounts rolled back.',
    );
  else {
    console.error(error.message);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
