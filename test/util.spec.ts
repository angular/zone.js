import {Zone} from '../lib/browser/zone';

describe('Util', function () {

  describe('Custom assertions', function() {
    var child = global.zone.fork();
    var grandChild = child.fork();

    describe('toBeChildOf', function() {
      it('should assert that the child zone is a child of the parent zone', function() {
        expect(child).toBeChildOf(global.zone);
        expect(grandChild).toBeChildOf(global.zone);
        expect(grandChild).toBeChildOf(child);

        expect(child).not.toBeChildOf(grandChild);
        expect(child).not.toBeChildOf(child);
      });
    });

    describe('toBeDirectChildOf', function() {
      it('should assert that the child zone is a direct child of the parent zone', function() {
        expect(child).toBeDirectChildOf(global.zone);
        expect(grandChild).toBeDirectChildOf(child);

        expect(grandChild).not.toBeDirectChildOf(global.zone);
        expect(child).not.toBeDirectChildOf(grandChild);
        expect(child).not.toBeDirectChildOf(child);
      });
    });
  });
});
