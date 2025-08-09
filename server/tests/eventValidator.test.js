const { validateEvent } = require('../validators/eventValidator');

function mockReq(body) {
  return { body };
}
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validateEvent middleware', () => {
  let next;
  beforeEach(() => {
    next = jest.fn();
  });

  it('passes valid event', () => {
    const req = mockReq({
      name: 'Test',
      location: 'Loc',
      urgency: 'low',
      requiredSkills: ['a'],
      details: 'desc'
    });
    const res = mockRes();
    validateEvent(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('fails missing name', () => {
    const req = mockReq({ location: 'Loc', urgency: 'low', requiredSkills: ['a'] });
    const res = mockRes();
    validateEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fails long name', () => {
    const req = mockReq({ name: 'a'.repeat(101), location: 'Loc', urgency: 'low', requiredSkills: ['a'] });
    const res = mockRes();
    validateEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fails invalid urgency', () => {
    const req = mockReq({ name: 'Test', location: 'Loc', urgency: 'urgent', requiredSkills: ['a'] });
    const res = mockRes();
    validateEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fails missing requiredSkills', () => {
    const req = mockReq({ name: 'Test', location: 'Loc', urgency: 'low' });
    const res = mockRes();
    validateEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fails details too long', () => {
    const req = mockReq({ name: 'Test', location: 'Loc', urgency: 'low', requiredSkills: ['a'], details: 'a'.repeat(501) });
    const res = mockRes();
    validateEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
}); 