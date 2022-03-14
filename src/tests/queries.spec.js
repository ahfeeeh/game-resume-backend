/** @format */
import * as db from '../../models/index';

const DEFAULT_TIMEOUT = 50000;
const { clearTables } = require('./dbclear');


let connection = db.sequelize;

const { batchInsert, insert, update, insertOrUpdate, select, exclude } = require('../_query');

const _cleanFn = async done => {
	try {
		await clearTables(connection, ['sections', 'modules', 'disciplines', 'users']);
		return true;
	} catch (e) {
		throw e;
	} finally {
		done();
	}
};

describe('Query Util', () => {
	beforeEach(_cleanFn);
	afterEach(_cleanFn);

	describe('batchInsert', () => {
		it('should generate a single insert statement and insert data', async () => {
			let data1 = [
				{ name: 'Português', created_at: new Date(), updated_at: new Date() },
				{
					name: 'Matemática',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{ name: 'História', created_at: new Date(), updated_at: new Date() },
				{
					name: 'Geografia',
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			await batchInsert('disciplines', data1, connection);

			let query2 = "(select id from disciplines where name = '{name}' limit 1)";

			let data2 = [
				{
					name: 'Módulo de Português',
					discipline_id: query2.replace('{name}', 'Português'),
					position: 1,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Módulo de Matemática',
					discipline_id: query2.replace('{name}', 'Matemática'),
					position: 2,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Módulo de História',
					discipline_id: query2.replace('{name}', 'História'),
					position: 3,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Módulo de Geografia',
					discipline_id: query2.replace('{name}', 'Geografia'),
					position: 4,
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			await batchInsert('modules', data2, connection);

			let query3 = "(select id from modules where name = '{name}' limit 1)";

			let data3 = [
				{
					name: 'Revisão de Português',
					code: 'REVPORT',
					module_id: query3.replace('{name}', 'Módulo de Português'),
					position: 1,
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			const { rows } = await batchInsert('sections', data3, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toBeGreaterThanOrEqual(1);
		});
		
		it('should generate a batch insert statement and insert data', async () => {
			let data1 = [
				{ name: 'Português', created_at: new Date(), updated_at: new Date() },
				{
					name: 'Matemática',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{ name: 'História', created_at: new Date(), updated_at: new Date() },
				{
					name: 'Geografia',
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			await batchInsert('disciplines', data1, connection);

			let query = "(select id from disciplines where name = '{name}' limit 1)";

			let data2 = [
				{
					name: 'Módulo de Português',
					discipline_id: query.replace('{name}', 'Português'),
					position: 1,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Módulo de Matemática',
					discipline_id: query.replace('{name}', 'Matemática'),
					position: 2,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Módulo de História',
					discipline_id: query.replace('{name}', 'História'),
					position: 3,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Módulo de Geografia',
					discipline_id: query.replace('{name}', 'Geografia'),
					position: 4,
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			const { rows } = await batchInsert('modules', data2, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('insert', () => {
		it('should generate a insert statement and execute', async () => {
			const data = {
				name: 'Felipe Rodrigues Michetti',
				email: 'frmichetti@gmail.com',
				created_at: new Date(),
				updated_at: new Date(),
			};

			const { rows } = await insert('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);
		});
	});

	describe('update', () => {
		it('should generate a update statement and execute', async () => {
			let data = {
				name: 'Felipe Rodrigues Michetti',
				email: 'frmichetti@gmail.com',
				created_at: new Date(),
				updated_at: new Date(),
			};
			const res = await insert('users', data, connection);

			data.id = res.rows[0].id;
			const { rows } = await update('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);
		});
	});

	describe('insertOrUpdate', () => {
		it('should generate a update statement and execute', async () => {
			let data = {
				name: 'Felipe Rodrigues Michetti',
				email: 'frmichetti@gmail.com',
				created_at: new Date(),
				updated_at: new Date(),
			};
			const res = await insertOrUpdate('users', data, connection);

			data.id = res.rows[0].id;
			const { rows } = await insertOrUpdate('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);
		});

		it('should generate a insert statement and execute', async () => {
			const data = {
				name: 'Felipe Rodrigues Michetti',
				email: 'frmichetti@gmail.com',
				created_at: new Date(),
				updated_at: new Date(),
			};

			const { rows } = await insertOrUpdate('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('select', () => {
		beforeEach(async done => {
			const promises = [1, 2, 3, 4, 5].map(n =>
				insert(
					'users',
					{
						name: `n${n}`,
						email: `email${n}@teste.com.br`,
						created_at: new Date(),
						updated_at: new Date(),
					},
					connection
				)
			);
			await Promise.all(promises);

			done();
		});

		afterEach(_cleanFn);

		it(
			'should return all rows when no options is specified',
			async done => {
				const { rows } = await select('users', {}, connection);
				expect(rows).not.toBeNull;
				expect(rows.length).toEqual(5);
				done();
			},
			DEFAULT_TIMEOUT
		);

		it(
			'should return all rows when options join is specified',
			async done => {
				const options = { join: [{ target: 'students', on: 'user_id = id', type: 'LEFT JOIN' }] };
				const { rows } = await select('users', options, connection);
				expect(rows).not.toBeNull;
				expect(rows.length).toEqual(5);
				done();
			},
			DEFAULT_TIMEOUT
		);

		it(
			'should return all rows when multiple options join is specified',
			async done => {
				const options = {
					join: [
						{ target: 'students s', on: 'user_id = s.id', type: 'LEFT JOIN' },
						{ target: 'advisors a', on: 's.advisor_id = a.id', type: 'LEFT JOIN' },
						{ target: 'classes c', on: 's.class_id = c.id', type: 'LEFT JOIN' },
					],
				};
				const { rows } = await select('users', options, connection);
				expect(rows).not.toBeNull;
				expect(rows.length).toEqual(5);
				done();
			},
			DEFAULT_TIMEOUT
		);

		it(
			'should return all rows when multiple options join and selects is specified',
			async done => {
				const options = {
					join: [
						{ target: 'students s', on: 'user_id = s.id', type: 'LEFT JOIN' },
						{ target: 'advisors a', on: 's.advisor_id = a.id', type: 'LEFT JOIN' },
						{ target: 'classes c', on: 's.class_id = c.id', type: 'LEFT JOIN' },
					],
					select: [
						{ table: 'u', column: 'id', as: 'user_id' },
						{ table: 's', column: 'id', as: 'student_id' },
						{ table: 'a', column: 'id', as: 'advisor_id' },
						{ table: 'c', column: 'id', as: 'class_id' },
					],
				};
				const { rows } = await select('users as u', options, connection);
				expect(rows).not.toBeNull;
				expect(rows.length).toEqual(5);
				done();
			},
			DEFAULT_TIMEOUT
		);

		it(
			'should return all rows when multiple options join, selects and where is specified',
			async done => {
				const options = {
					join: [
						{ target: 'students s', on: 'user_id = s.id', type: 'LEFT JOIN' },
						{ target: 'advisors a', on: 's.advisor_id = a.id', type: 'LEFT JOIN' },
						{ target: 'classes c', on: 's.class_id = c.id', type: 'LEFT JOIN' },
					],
					select: [
						{ table: 'u', column: 'id', as: 'user_id' },
						{ table: 's', column: 'id', as: 'student_id' },
						{ table: 'a', column: 'id', as: 'advisor_id' },
						{ table: 'c', column: 'id', as: 'class_id' },
					],
					where: 'u.id > 0',
				};
				const { rows } = await select('users as u', options, connection);
				expect(rows).not.toBeNull;
				expect(rows.length).toEqual(5);
				done();
			},
			DEFAULT_TIMEOUT
		);

		it(
			'should return all rows when multiple options join, selects, where, limit and offset is specified',
			async done => {
				const options = {
					join: [
						{ target: 'students s', on: 'user_id = s.id', type: 'LEFT JOIN' },
						{ target: 'advisors a', on: 's.advisor_id = a.id', type: 'LEFT JOIN' },
						{ target: 'classes c', on: 's.class_id = c.id', type: 'LEFT JOIN' },
					],
					select: [
						{ table: 'u', column: 'id', as: 'user_id' },
						{ table: 's', column: 'id', as: 'student_id' },
						{ table: 'a', column: 'id', as: 'advisor_id' },
						{ table: 'c', column: 'id', as: 'class_id' },
					],
					where: 'u.id > 0',
					limit: 3,
					offset: 2,
				};
				const { rows } = await select('users as u', options, connection);
				expect(rows).not.toBeNull;
				expect(rows.length).toEqual(3);
				done();
			},
			DEFAULT_TIMEOUT
		);
	});

	describe('exclude', () => {
		it('should generate a delete statement and execute when no options is provided', async () => {
			const data = {
				name: 'Felipe Rodrigues Michetti',
				email: 'felipe.michetti@teste.com.br',
				created_at: new Date(),
				updated_at: new Date(),
			};

			let { rows } = await insert('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);

			({ rows } = await exclude('users', {}, connection));
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);
		});

		it('should generate a delete statement and execute when literal condition is provided', async () => {
			const data = [
				{
					name: 'Felipe Rodrigues Michetti',
					email: 'felipe.michetti@teste.com.br',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: 'Felipe Rodrigues Michetti 2',
					email: 'felipe.michetti@teste.com.br2',
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			let { rows } = await batchInsert('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(2);

			const conditions = { literal: 'id > 0' };
			({ rows } = await exclude('users', conditions, connection));
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(2);
		});

		it('should generate a delete statement and execute when id condition is provided', async () => {
			const data = [
				{
					name: 'Felipe Rodrigues Michetti',
					email: 'felipe.michetti@teste.com.br',
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			let { rows } = await batchInsert('users', data, connection);
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);

			const conditions = { id: rows[0].id };
			({ rows } = await exclude('users', conditions, connection));
			expect(rows).not.toBeNull;
			expect(rows.length).toEqual(1);
		});
	});
});
