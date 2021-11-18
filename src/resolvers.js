// The root provides a resolver function for each API endpoint
export const root = {
    hello: () => {
      return 'Hello world!';
    },
    allWiiUGames: async (_,ctx) => {        
        const games = ctx.db.query('SELECT * FROM [wiiu_games]')
        return games;
    }
  };  