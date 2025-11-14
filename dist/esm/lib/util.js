import delegate from 'delegates';
/**
 * Delegate socket methods and properties to Koa context
 * This allows accessing socket methods via ctx.socket.*
 */
export function delegateSocket(ctx) {
    delegate(ctx, 'socket')
        .getter('client')
        .getter('server')
        .getter('adapter')
        .getter('id')
        .getter('conn')
        .getter('rooms')
        .getter('acks')
        .getter('json')
        .getter('volatile')
        .getter('broadcast')
        .getter('connected')
        .getter('disconnected')
        .getter('handshake')
        .method('join')
        .method('leave')
        .method('emit')
        .method('to')
        .method('in')
        .method('send')
        .method('write')
        .method('disconnect');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFHakM7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxHQUFZO0lBQ3pDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDO1NBQ3BCLE1BQU0sQ0FBQyxRQUFRLENBQUM7U0FDaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQztTQUNoQixNQUFNLENBQUMsU0FBUyxDQUFDO1NBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7U0FDWixNQUFNLENBQUMsTUFBTSxDQUFDO1NBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQztTQUNmLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDZCxNQUFNLENBQUMsTUFBTSxDQUFDO1NBQ2QsTUFBTSxDQUFDLFVBQVUsQ0FBQztTQUNsQixNQUFNLENBQUMsV0FBVyxDQUFDO1NBQ25CLE1BQU0sQ0FBQyxXQUFXLENBQUM7U0FDbkIsTUFBTSxDQUFDLGNBQWMsQ0FBQztTQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDO1NBQ25CLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDZCxNQUFNLENBQUMsT0FBTyxDQUFDO1NBQ2YsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUM7U0FDWixNQUFNLENBQUMsSUFBSSxDQUFDO1NBQ1osTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUNkLE1BQU0sQ0FBQyxPQUFPLENBQUM7U0FDZixNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDMUIsQ0FBQyJ9