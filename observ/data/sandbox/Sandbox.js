/**
 * copyright (c) 2014 Chris Moser (cpmoser@network54.com)
 */


Ext.define("observ.data.sandbox.Sandbox", function ()
{
	var objects = {}, counter = 1;

	return {

		observ:
		{
			broadcast:
			{
				set: true
			},

			callable:
			{
				createObject: true,
				getObject: true,
				getObjects: true,
				getObjectCacheCount: true
			}
		},

		extend: "observ.data.Model",

		fields:
		[
			{
				name: "name",
				type: "string"
			},

			{
				name: "description",
				type: "string"
			},

			{
				name: "ns",
				type: "string"
			},

			{
				name: "location",
				type: "string"
			},

			{
				name: "count",
				type: "int"
			},

			{
				name: "cacheCount",
				type: "int"
			},

			{
				name: "foo",
				type: "string"
			},

			{
				name: "ticks",
				type: "int"
			},

			{
				name: "heapTotal",
				type: "int"
			},

			{
				name: "heapUsed",
				type: "int"
			},

			{
				name: "cpu",
				type: "float"
			}
		],

		add: function (obj)
		{
			objects[counter++] = obj;
		},

		startup: function (vm)
		{
			if (vm === undefined)
			{
				console.log("instantiating VM");
			}
			else
			{
				console.log("using existing VM");
				this.vm = vm;
			}
		},

		tick: function ()
		{
			var tick = this.get("ticks"), me = this;

			var mem = Ext.process.memoryUsage();

			this.set("heapTotal", mem.heapTotal);
			this.set("heapUsed", mem.heapUsed);

			var pid = Ext.process.pid, usage = require("usage");

			usage.lookup(pid, function (err, result)
			{
				me.set("cpu", result.cpu);
			});

			tick++;

			this.set("ticks", tick);

			Ext.defer(this.tick, 1000, this);
		},

		shutdown: function ()
		{

		},

		constructor: function (data)
		{
			this.callParent(arguments);

		//	this.add(this);

			if (!this.vm)
			{
				// create a new vm and set the loader path
			}
		},

		setPersistence: function (persistence)
		{
			this.persistence = persistence;
		},

		getObject: function (id)
		{
			var me = this, promise, persist = this.persistence;

			promise = require("Q").Promise(function (resolve, reject, notify)
			{
				var o = objects[id], c, g;

				if (o)
				{
					resolve(o);
				}
				else
				{
					try
					{
						c = persist.conn().collection("objects");

						g = c.findOne({_id: persist.id(id)}, function (err, doc)
						{
							objects[id] = me.vm.create(doc.className, doc.data, doc._id);
							resolve(objects[id]);
						});
					}
					catch (e)
					{
						console.log(e);
					}
				}
			});

			return promise;
		},

		getObjects: function ()
		{
			var me = this, promise, persist = this.persistence;

			promise = require("Q").Promise(function (resolve, reject, notify)
			{
				console.log("executing the promise");

				var collection = persist.conn().collection("objects");

				try
				{
					g = collection.find({}, {className: 1}, function (err, docs)
					{
						docs.toArray(function (err, a)
						{
							console.log(a);
							resolve(a);
						});
					});
				}
				catch (e)
				{
					console.log(e.message);
					console.log(e.stack);
				}
			});

			return promise;
		},

		getObjectCacheCount: function ()
		{
			var promise = require("Q").Promise(function (resolve, reject, notify)
			{
				resolve(Object.keys(objects).length);
			});

			return promise;
		},

		createObject: function (className, data)
		{
			try
			{
				var
					me = this,
					promise = require("Q").Promise(function (resolve, reject, notify)
					{
						console.log("inside promise");

						try
						{
							var
								o = me.vm.create(className, data),
								c = me.persistence.conn().collection("objects"),

								d =
								{
									className: o.$className,
									data:      o.getData()
								};

							c.insert(d, {}, function (err, records)
							{
								console.log(err);

								o.setId(records[0]._id);
								o.commit();

								resolve(o);
							});
						}
						catch (e)
						{
							reject(e);
						}
					});

				return promise;
			}
			catch (e)
			{
				console.log(e.message);
			}
		},

		create: function (connection, className, data, theirRemoter, clientCb)
		{
			var
				o = this.vm.create(className, data),
				c = this.persistence.conn().collection("objects"),

				d =
				{
					className: o.$className,
					data:      o.getData()
				};

			clientCb = clientCb || Ext.emptyFn;

			c.insert(d, {}, function (err, records)
			{
				try
				{
					if (err)
					{
						throw new Error("database error");
					}

					o.setId(records[0]._id);
					o.commit();

					clientCb(
						o.id,
						o.$className,
						o.data,
						theirRemoter ? o.addRemote(connection, theirRemoter) : undefined
					);
				}
				catch (e)
				{
					clientCb(false, null, null, null);
				}
			});

			return o;
		}
	};
});
